// Firestore rules tests for site-wide announcements, which only admins post.
// Run with npm run test:rules.
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { Timestamp, deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

let env;
const token = extra => ({ email_verified: true, firebase: { sign_in_provider: 'password' }, ...extra });
const asAdmin = () => env.authenticatedContext('boss', token({ admin: true, moderator: true })).firestore();
const asMod = () => env.authenticatedContext('mod', token({ moderator: true })).firestore();
const asMember = () => env.authenticatedContext('alice', token()).firestore();
const anon = () => env.unauthenticatedContext().firestore();

const start = Timestamp.now();
const end = Timestamp.fromMillis(start.toMillis() + 7 * 864e5);
const announcement = (extra = {}) => ({
  title: 'New groups', message: 'Study groups start Monday', type: 'info', link: '/studygroups',
  startTime: start, endTime: end, isActive: true, createdAt: serverTimestamp(), createdBy: 'boss', ...extra,
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-w3develops-announcements',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  });
});
after(async () => env?.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(ctx =>
    setDoc(doc(ctx.firestore(), 'announcements', 'a1'), { ...announcement(), createdAt: start }));
});

describe('posting', () => {
  test('an admin can post one', async () => {
    await assertSucceeds(setDoc(doc(asAdmin(), 'announcements', 'new'), announcement()));
  });
  test('with an https link or no link', async () => {
    await assertSucceeds(setDoc(doc(asAdmin(), 'announcements', 'n1'), announcement({ link: 'https://example.com/x' })));
    const { link, ...noLink } = announcement();
    await assertSucceeds(setDoc(doc(asAdmin(), 'announcements', 'n2'), noLink));
  });
  test('moderators, members and visitors cannot', async () => {
    await assertFails(setDoc(doc(asMod(), 'announcements', 'new'), announcement({ createdBy: 'mod' })));
    await assertFails(setDoc(doc(asMember(), 'announcements', 'new'), announcement({ createdBy: 'alice' })));
    await assertFails(setDoc(doc(anon(), 'announcements', 'new'), announcement()));
  });
  test('only valid ones', async () => {
    const db = asAdmin();
    for (const bad of [
      { createdBy: 'someone' }, { createdAt: start }, { title: '' }, { title: 'x'.repeat(81) },
      { message: 'x'.repeat(301) }, { type: 'party' }, { link: 'javascript:alert(1)' },
      { link: 'http://example.com' }, { link: '//evil.example' }, { endTime: start }, { isActive: 'yes' }, { extra: 1 },
    ]) await assertFails(setDoc(doc(db, 'announcements', 'bad'), announcement(bad)));
  });
});

describe('changing', () => {
  test('an admin can end one early or delete it', async () => {
    await assertSucceeds(updateDoc(doc(asAdmin(), 'announcements', 'a1'), { isActive: false }));
    await assertSucceeds(deleteDoc(doc(asAdmin(), 'announcements', 'a1')));
  });
  test('an admin cannot rewrite its wording', async () => {
    await assertFails(updateDoc(doc(asAdmin(), 'announcements', 'a1'), { title: 'Changed' }));
  });
  test('others cannot end or delete it', async () => {
    await assertFails(updateDoc(doc(asMod(), 'announcements', 'a1'), { isActive: false }));
    await assertFails(deleteDoc(doc(asMember(), 'announcements', 'a1')));
  });
  test('anyone can read them', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'announcements', 'a1')));
  });
});
