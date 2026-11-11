// Firestore rules tests for member articles on /news. Run with: npm run test:rules
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, getDocs, collection, query, where, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

let env;
const TOKENS = {
  alice: { email: 'a@example.com', email_verified: true, firebase: { sign_in_provider: 'password' } },
  bob: { email: 'b@example.com', email_verified: true, firebase: { sign_in_provider: 'password' } },
  mod: { email: 'm@example.com', email_verified: true, moderator: true, firebase: { sign_in_provider: 'password' } },
};
const as = name => env.authenticatedContext(name, TOKENS[name]).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const application = extra => ({ about: 'I write about React.', links: ['https://dev.to/alice/post'], topics: [], status: 'pending', createdAt: serverTimestamp(), ...extra });
const article = (uid, extra = {}) => ({ authorId: uid, authorName: uid, authorPhoto: '', title: 'Learning hooks the easy way', summary: 'A short guide.', body: '## Intro\nHello', topic: 'programming', status: 'draft', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...extra });

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-w3develops-articles', firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') } });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async c => {
    for (const n of ['alice', 'bob', 'mod']) await setDoc(doc(c.firestore(), 'users', n), { username: n, profilePictureUrl: '' });
  });
});
const makeWriter = uid => env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'writers', uid), { approvedBy: 'mod', approvedAt: new Date() }));

describe('writer applications', () => {
  test('members apply for themselves with 1 to 3 https links', async () => {
    await assertFails(setDoc(doc(as('alice'), 'writerApplications', 'bob'), application()));
    await assertFails(setDoc(doc(as('alice'), 'writerApplications', 'alice'), application({ links: [] })));
    await assertFails(setDoc(doc(as('alice'), 'writerApplications', 'alice'), application({ links: ['http://x.com'] })));
    await assertFails(setDoc(doc(as('alice'), 'writerApplications', 'alice'), application({ status: 'approved' })));
    await assertSucceeds(setDoc(doc(as('alice'), 'writerApplications', 'alice'), application()));
    await assertFails(getDoc(doc(as('bob'), 'writerApplications', 'alice')));
  });

  test('moderators approve by adding a writer in the same save', async () => {
    await setDoc(doc(as('alice'), 'writerApplications', 'alice'), application());
    const decide = { status: 'approved', reviewedBy: 'mod', reviewedAt: serverTimestamp(), note: '' };
    await assertFails(updateDoc(doc(as('mod'), 'writerApplications', 'alice'), decide));
    await assertFails(updateDoc(doc(as('alice'), 'writerApplications', 'alice'), decide));
    const db = as('mod');
    const batch = writeBatch(db);
    batch.set(doc(db, 'writers', 'alice'), { approvedBy: 'mod', approvedAt: serverTimestamp() });
    batch.update(doc(db, 'writerApplications', 'alice'), decide);
    await assertSucceeds(batch.commit());
    await assertFails(setDoc(doc(as('alice'), 'writers', 'bob'), { approvedBy: 'alice', approvedAt: serverTimestamp() }));
  });
});

describe('articles', () => {
  test('only writers create articles, as drafts or submitted', async () => {
    await assertFails(setDoc(doc(as('alice'), 'articles', 'a1'), article('alice')));
    await makeWriter('alice');
    await assertFails(setDoc(doc(as('alice'), 'articles', 'a1'), article('alice', { status: 'published' })));
    await assertFails(setDoc(doc(as('alice'), 'articles', 'a1'), article('alice', { title: 'Short' })));
    await assertFails(setDoc(doc(as('alice'), 'articles', 'a1'), article('alice', { body: 'free porn here' })));
    await assertFails(setDoc(doc(as('alice'), 'articles', 'a1'), article('alice', { authorName: 'admin' })));
    await assertSucceeds(setDoc(doc(as('alice'), 'articles', 'a1'), article('alice', { status: 'submitted' })));
  });

  test('drafts are private; published articles are public', async () => {
    await makeWriter('alice');
    await setDoc(doc(as('alice'), 'articles', 'a1'), article('alice', { status: 'submitted' }));
    await assertFails(getDoc(doc(anon(), 'articles', 'a1')));
    await assertSucceeds(getDoc(doc(as('mod'), 'articles', 'a1')));
    await assertSucceeds(getDocs(query(collection(as('alice'), 'articles'), where('authorId', '==', 'alice'))));
    await assertFails(updateDoc(doc(as('alice'), 'articles', 'a1'), { status: 'published', publishedAt: serverTimestamp(), reviewedBy: 'alice' }));
    await assertSucceeds(updateDoc(doc(as('mod'), 'articles', 'a1'), { status: 'published', publishedAt: serverTimestamp(), reviewedBy: 'mod', editorNote: '' }));
    await assertSucceeds(getDoc(doc(anon(), 'articles', 'a1')));
    await assertSucceeds(getDocs(query(collection(anon(), 'articles'), where('status', '==', 'published'))));
    // Writers can't change or delete a published article
    await assertFails(updateDoc(doc(as('alice'), 'articles', 'a1'), { title: 'A changed title here', updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(doc(as('alice'), 'articles', 'a1')));
  });

  test('a sent-back article can be fixed and resubmitted', async () => {
    await makeWriter('alice');
    await setDoc(doc(as('alice'), 'articles', 'a1'), article('alice', { status: 'submitted' }));
    await assertSucceeds(updateDoc(doc(as('mod'), 'articles', 'a1'), { status: 'rejected', reviewedBy: 'mod', editorNote: 'Add an example' }));
    await assertSucceeds(updateDoc(doc(as('alice'), 'articles', 'a1'), { body: '## Intro\nWith an example', status: 'submitted', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as('bob'), 'articles', 'a1'), { body: 'x', updatedAt: serverTimestamp() }));
  });
});
