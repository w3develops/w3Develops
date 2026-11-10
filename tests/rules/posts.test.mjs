// Firestore rules tests for w3Develops' own posts (the scheduled blog posts
// on /news). Run with npm run test:rules.
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { Timestamp, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';

let env;
const member = () => env.authenticatedContext('alice', { email_verified: true, firebase: { sign_in_provider: 'password' } }).firestore();
const moderator = () => env.authenticatedContext('mod', { email_verified: true, moderator: true, firebase: { sign_in_provider: 'password' } }).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const post = { topic: 'crypto', title: 'Roundup', description: '', intro: '', sections: [], aiWritten: false, editionId: 'x', createdAt: Timestamp.now() };

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-w3develops-posts',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  });
});
after(async () => env?.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'posts', '2026-11-10-crypto'), post));
});

describe('w3Develops posts', () => {
  test('anyone can read and filter them', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'posts', '2026-11-10-crypto')));
    await assertSucceeds(getDocs(query(collection(anon(), 'posts'), where('topic', '==', 'crypto'))));
  });

  test('no one can write them from the browser, not even moderators', async () => {
    for (const db of [anon(), member(), moderator()]) {
      await assertFails(setDoc(doc(db, 'posts', '2026-11-10-sales'), post));
      await assertFails(updateDoc(doc(db, 'posts', '2026-11-10-crypto'), { title: 'Changed' }));
      await assertFails(deleteDoc(doc(db, 'posts', '2026-11-10-crypto')));
    }
  });
});
