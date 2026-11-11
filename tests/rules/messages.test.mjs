// Firestore rules tests for direct messages (18 and over). Run with: npm run test:rules
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { Timestamp, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

let env;
const YEAR = 365.25 * 24 * 3600 * 1000;
const TOKENS = Object.fromEntries(['adam', 'beth', 'kid', 'eve', 'mod'].map(n => [n, { email: `${n}@example.com`, email_verified: true, ...(n === 'mod' && { moderator: true }), firebase: { sign_in_provider: 'password' } }]));
const as = name => env.authenticatedContext(name, TOKENS[name]).firestore();

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-w3develops-messages', firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') } });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async c => {
    const db = c.firestore();
    for (const n of ['adam', 'beth', 'kid', 'eve', 'mod']) await setDoc(doc(db, 'users', n), { username: n });
    await setDoc(doc(db, 'ages', 'adam'), { birthDate: Timestamp.fromMillis(Date.now() - 30 * YEAR), confirmedAt: Timestamp.now() });
    await setDoc(doc(db, 'ages', 'beth'), { birthDate: Timestamp.fromMillis(Date.now() - 25 * YEAR), confirmedAt: Timestamp.now() });
    await setDoc(doc(db, 'ages', 'kid'), { birthDate: Timestamp.fromMillis(Date.now() - 16 * YEAR), confirmedAt: Timestamp.now() });
    // eve never entered a birth date
  });
});

/** Starts a conversation the way /messages does: the conversation and its first message in one save */
function firstMessage(db, from, to, text = 'Hi!') {
  const id = [from, to].sort().join('_');
  const batch = writeBatch(db);
  batch.set(doc(db, 'conversations', id), { memberIds: [from, to].sort(), createdAt: serverTimestamp(), lastMessageAt: serverTimestamp(), lastMessageText: text, lastSenderId: from });
  batch.set(doc(db, 'conversations', id, 'messages', 'm1'), { senderId: from, text, createdAt: serverTimestamp() });
  return batch.commit();
}

describe('ages', () => {
  test('members enter their own birth date once and only they can read it', async () => {
    await assertFails(setDoc(doc(as('adam'), 'ages', 'eve'), { birthDate: Timestamp.fromMillis(0), confirmedAt: serverTimestamp() }));
    await assertSucceeds(setDoc(doc(as('eve'), 'ages', 'eve'), { birthDate: Timestamp.fromMillis(Date.now() - 20 * YEAR), confirmedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as('kid'), 'ages', 'kid'), { birthDate: Timestamp.fromMillis(Date.now() - 40 * YEAR) }));
    await assertFails(deleteDoc(doc(as('kid'), 'ages', 'kid')));
    await assertFails(getDoc(doc(as('adam'), 'ages', 'beth')));
    await assertSucceeds(getDoc(doc(as('beth'), 'ages', 'beth')));
  });
});

describe('messages', () => {
  test('two adults can message', async () => {
    await assertSucceeds(firstMessage(as('adam'), 'adam', 'beth'));
    const db = as('beth');
    const batch = writeBatch(db);
    batch.update(doc(db, 'conversations', 'adam_beth'), { lastMessageAt: serverTimestamp(), lastMessageText: 'Hello', lastSenderId: 'beth' });
    batch.set(doc(db, 'conversations', 'adam_beth', 'messages', 'm2'), { senderId: 'beth', text: 'Hello', createdAt: serverTimestamp() });
    await assertSucceeds(batch.commit());
  });

  test('nobody under 18, or without a birth date, can send or receive', async () => {
    await assertFails(firstMessage(as('kid'), 'kid', 'adam'));
    await assertFails(firstMessage(as('adam'), 'adam', 'kid'));
    await assertFails(firstMessage(as('eve'), 'eve', 'adam'));
    await assertFails(firstMessage(as('adam'), 'adam', 'eve'));
  });

  test('blocking either way stops messages', async () => {
    await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'users', 'beth', 'private', 'feedPrefs'), { blockedIds: ['adam'] }));
    await assertFails(firstMessage(as('adam'), 'adam', 'beth'));
    await assertFails(firstMessage(as('beth'), 'beth', 'adam'));
  });

  test('only the two members read the conversation; moderators do not', async () => {
    await firstMessage(as('adam'), 'adam', 'beth');
    await assertSucceeds(getDocs(collection(as('beth'), 'conversations', 'adam_beth', 'messages')));
    await assertFails(getDocs(collection(as('eve'), 'conversations', 'adam_beth', 'messages')));
    await assertFails(getDocs(collection(as('mod'), 'conversations', 'adam_beth', 'messages')));
    await assertFails(getDoc(doc(as('mod'), 'conversations', 'adam_beth')));
  });

  test('conversations must be named by the sorted pair, and messages sent as yourself', async () => {
    const db = as('adam');
    const batch = writeBatch(db);
    batch.set(doc(db, 'conversations', 'beth_adam'), { memberIds: ['beth', 'adam'], createdAt: serverTimestamp() });
    await assertFails(batch.commit());
    await firstMessage(as('adam'), 'adam', 'beth');
    await assertFails(setDoc(doc(as('adam'), 'conversations', 'adam_beth', 'messages', 'x'), { senderId: 'beth', text: 'fake', createdAt: serverTimestamp() }));
    await assertFails(setDoc(doc(as('adam'), 'conversations', 'adam_beth', 'messages', 'y'), { senderId: 'adam', text: 'kill yourself', createdAt: serverTimestamp() }));
  });

  test('a member reports one message, and the report carries only that message', async () => {
    await firstMessage(as('adam'), 'adam', 'beth', 'rude message');
    const report = extra => setDoc(doc(as('beth'), 'reports', 'm1_beth'), {
      reporterId: 'beth', reportedUserId: 'adam', conversationId: 'adam_beth', messageId: 'm1', messageText: 'rude message',
      reason: 'harassment', details: '', page: '/messages', status: 'open', createdAt: serverTimestamp(), ...extra,
    });
    await assertFails(report({ messageText: 'something else' }));
    await assertSucceeds(report({}));
    await assertFails(setDoc(doc(as('eve'), 'reports', 'm1_eve'), {
      reporterId: 'eve', reportedUserId: 'adam', conversationId: 'adam_beth', messageId: 'm1', messageText: 'rude message',
      reason: 'harassment', details: '', page: '/messages', status: 'open', createdAt: serverTimestamp(),
    }));
  });

  test('read markers: each member sets only their own', async () => {
    await firstMessage(as('adam'), 'adam', 'beth');
    await assertSucceeds(updateDoc(doc(as('beth'), 'conversations', 'adam_beth'), { 'readAt.beth': serverTimestamp() }));
    await assertFails(updateDoc(doc(as('beth'), 'conversations', 'adam_beth'), { 'readAt.adam': serverTimestamp() }));
  });
});
