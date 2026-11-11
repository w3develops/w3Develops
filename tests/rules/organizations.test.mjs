// Firestore rules tests for organization pages. Run with: npm run test:rules
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { arrayRemove, arrayUnion, deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

let env;
const TOKENS = Object.fromEntries(['alice', 'bob', 'carol'].map(n => [n, { email: `${n}@example.com`, email_verified: true, firebase: { sign_in_provider: 'password' } }]));
const as = name => env.authenticatedContext(name, TOKENS[name]).firestore();
const org = (uid, extra = {}) => ({ name: 'Code for Good', kind: 'nonprofit', tagline: 'Volunteer devs', about: '', website: '', location: '', ownerId: uid, adminIds: [uid], memberIds: [uid], createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...extra });

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-w3develops-orgs', firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') } });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async c => {
    for (const n of ['alice', 'bob', 'carol']) await setDoc(doc(c.firestore(), 'users', n), { username: n, profilePictureUrl: '' });
  });
});

describe('organizations', () => {
  test('a member creates a page as its owner, under a valid address', async () => {
    await assertFails(setDoc(doc(as('alice'), 'organizations', 'X'), org('alice')));
    await assertFails(setDoc(doc(as('alice'), 'organizations', '-bad-'), org('alice')));
    await assertFails(setDoc(doc(as('alice'), 'organizations', 'admin'), org('alice')));
    await assertFails(setDoc(doc(as('alice'), 'organizations', 'code-for-good'), org('alice', { memberIds: ['alice', 'bob'] })));
    await assertFails(setDoc(doc(as('alice'), 'organizations', 'code-for-good'), org('bob')));
    await assertFails(setDoc(doc(as('alice'), 'organizations', 'code-for-good'), org('alice', { website: 'http://x.org' })));
    await assertSucceeds(setDoc(doc(as('alice'), 'organizations', 'code-for-good'), org('alice')));
    await assertFails(setDoc(doc(as('bob'), 'organizations', 'code-for-good'), org('bob')));
  });

  test('join requests: members ask, admins accept', async () => {
    await setDoc(doc(as('alice'), 'organizations', 'cfg'), org('alice'));
    const request = db => doc(db, 'organizations', 'cfg', 'joinRequests', 'bob');
    await assertFails(setDoc(request(as('carol')), { name: 'bob', photo: '', note: '', createdAt: serverTimestamp() }));
    await assertSucceeds(setDoc(request(as('bob')), { name: 'bob', photo: '', note: 'Hi!', createdAt: serverTimestamp() }));
    await assertFails(getDoc(request(as('carol'))));
    // Bob can't add himself
    await assertFails(updateDoc(doc(as('bob'), 'organizations', 'cfg'), { memberIds: arrayUnion('bob') }));
    const db = as('alice');
    const batch = writeBatch(db);
    batch.update(doc(db, 'organizations', 'cfg'), { memberIds: arrayUnion('bob'), updatedAt: serverTimestamp() });
    batch.delete(request(db));
    await assertSucceeds(batch.commit());
  });

  test('only the owner chooses admins; admins edit; members leave', async () => {
    await setDoc(doc(as('alice'), 'organizations', 'cfg'), org('alice'));
    await env.withSecurityRulesDisabled(c => updateDoc(doc(c.firestore(), 'organizations', 'cfg'), { memberIds: ['alice', 'bob', 'carol'] }));
    await assertFails(updateDoc(doc(as('bob'), 'organizations', 'cfg'), { tagline: 'Mine', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(doc(as('alice'), 'organizations', 'cfg'), { adminIds: arrayUnion('bob'), updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(doc(as('bob'), 'organizations', 'cfg'), { tagline: 'Updated', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as('bob'), 'organizations', 'cfg'), { adminIds: arrayUnion('carol'), updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as('bob'), 'organizations', 'cfg'), { adminIds: arrayRemove('alice'), memberIds: arrayRemove('alice'), updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(doc(as('carol'), 'organizations', 'cfg'), { memberIds: arrayRemove('carol') }));
    await assertFails(deleteDoc(doc(as('bob'), 'organizations', 'cfg')));
    await assertSucceeds(deleteDoc(doc(as('alice'), 'organizations', 'cfg')));
  });
});
