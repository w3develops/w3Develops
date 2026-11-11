// Firestore rules tests for the services directory on /marketplace. Run with:
//   npm run test:rules
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { Timestamp, deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

let env;
const TOKENS = {
  alice: { email: 'alice@example.com', email_verified: true, firebase: { sign_in_provider: 'password' } },
  bob: { email: 'bob@example.com', email_verified: true, firebase: { sign_in_provider: 'password' } },
  unverified: { email: 'u@example.com', email_verified: false, firebase: { sign_in_provider: 'password' } },
  mod: { email: 'mod@example.com', email_verified: true, moderator: true, firebase: { sign_in_provider: 'password' } },
};
const as = name => env.authenticatedContext(name, TOKENS[name]).firestore();
const anon = () => env.unauthenticatedContext().firestore();

function listing(uid, extra = {}) {
  return {
    ownerId: uid, ownerName: uid, ownerPhoto: '', title: 'Portfolio websites', description: 'I build fast sites with Next.js.',
    category: 'websites', skills: ['react', 'next.js'], priceNote: 'From $200', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...extra,
  };
}
const create = (db, id, uid, extra) => setDoc(doc(db, 'serviceListings', id), listing(uid, extra));

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-w3develops-services',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    for (const name of ['alice', 'bob', 'unverified', 'mod']) {
      await setDoc(doc(context.firestore(), 'users', name), { username: name, profilePictureUrl: '' });
    }
  });
});

describe('service listings', () => {
  test('anyone can read listings', async () => {
    await create(as('alice'), 'alice_1', 'alice');
    await assertSucceeds(getDoc(doc(anon(), 'serviceListings', 'alice_1')));
  });

  test('a verified member lists up to five services under their own ID', async () => {
    for (const slot of [1, 2, 3, 4, 5]) await assertSucceeds(create(as('alice'), `alice_${slot}`, 'alice'));
    await assertFails(create(as('alice'), 'alice_6', 'alice'));
    await assertFails(create(as('alice'), 'alice_x', 'alice'));
    await assertFails(create(as('alice'), 'bob_1', 'alice'));
    await assertFails(create(as('alice'), 'alice_7', 'bob'));
  });

  test('unverified members and visitors cannot list', async () => {
    await assertFails(create(as('unverified'), 'unverified_1', 'unverified'));
    await assertFails(create(anon(), 'x_1', 'x'));
  });

  test('listings are checked', async () => {
    await assertFails(create(as('alice'), 'alice_1', 'alice', { ownerName: 'admin' }));
    await assertFails(create(as('alice'), 'alice_1', 'alice', { title: '' }));
    await assertFails(create(as('alice'), 'alice_1', 'alice', { title: 'a'.repeat(81) }));
    await assertFails(create(as('alice'), 'alice_1', 'alice', { description: 'a'.repeat(1001) }));
    await assertFails(create(as('alice'), 'alice_1', 'alice', { description: 'cheap porn sites' }));
    await assertFails(create(as('alice'), 'alice_1', 'alice', { category: 'crypto' }));
    await assertFails(create(as('alice'), 'alice_1', 'alice', { skills: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] }));
    await assertFails(create(as('alice'), 'alice_1', 'alice', { skills: ['React'] }));
    await assertFails(create(as('alice'), 'alice_1', 'alice', { contactUrl: 'http://example.com' }));
    await assertFails(create(as('alice'), 'alice_1', 'alice', { email: 'alice@example.com' }));
    await assertFails(create(as('alice'), 'alice_1', 'alice', { createdAt: Timestamp.fromMillis(0) }));
    await assertSucceeds(create(as('alice'), 'alice_1', 'alice', { contactUrl: 'https://alice.dev', skills: [], priceNote: '' }));
  });

  test('the owner edits and removes their listing; others cannot', async () => {
    await create(as('alice'), 'alice_1', 'alice');
    const ref = db => doc(db, 'serviceListings', 'alice_1');
    await assertFails(updateDoc(ref(as('bob')), { title: 'Mine now', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(as('alice')), { title: 'New title' }));
    await assertFails(updateDoc(ref(as('alice')), { ownerId: 'bob', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref(as('alice')), { title: 'New title', updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(ref(as('bob'))));
    await assertSucceeds(deleteDoc(ref(as('alice'))));
  });

  test('moderators edit or delete a listing with a log entry', async () => {
    await create(as('alice'), 'alice_1', 'alice');
    const db = as('mod');
    const edit = writeBatch(db);
    edit.set(doc(db, 'moderationLog', 'log1'), { actorId: 'mod', action: 'edit-content', contentPath: 'serviceListings/alice_1', targetUserId: 'alice', note: '', createdAt: serverTimestamp() });
    edit.update(doc(db, 'serviceListings', 'alice_1'), { title: 'Websites', moderationLogId: 'log1' });
    await assertSucceeds(edit.commit());
    await assertFails(deleteDoc(doc(db, 'serviceListings', 'alice_1')));
    const remove = writeBatch(db);
    remove.set(doc(db, 'moderationLog', 'delete-serviceListings-alice_1'), { actorId: 'mod', action: 'delete-content', contentPath: 'serviceListings/alice_1', targetUserId: 'alice', note: '', createdAt: serverTimestamp() });
    remove.delete(doc(db, 'serviceListings', 'alice_1'));
    await assertSucceeds(remove.commit());
  });
});
