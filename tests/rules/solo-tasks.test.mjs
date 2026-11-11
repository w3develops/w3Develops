// Firestore rules tests for solo project tasks. Run with: npm run test:rules
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

let env;
const TOKENS = {
  alice: { email: 'alice@example.com', email_verified: true, firebase: { sign_in_provider: 'password' } },
  bob: { email: 'bob@example.com', email_verified: true, firebase: { sign_in_provider: 'password' } },
};
const as = name => env.authenticatedContext(name, TOKENS[name]).firestore();
const task = (creatorId, extra = {}) => ({ description: 'Write the README', priority: 'medium', isCompleted: false, creatorId, createdAt: serverTimestamp(), position: 0, ...extra });

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-w3develops-solo-tasks',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'soloProjects', 'p1'), { userId: 'alice', name: 'Site', projectUrl: 'https://a.dev', description: '' });
  });
});

describe('solo project tasks', () => {
  test('only the owner adds, ticks off and deletes tasks', async () => {
    const ref = db => doc(db, 'soloProjects', 'p1', 'tasks', 't1');
    await assertFails(setDoc(ref(as('bob')), task('bob')));
    await assertFails(setDoc(ref(as('alice')), task('alice', { isCompleted: true })));
    await assertSucceeds(setDoc(ref(as('alice')), task('alice')));
    await assertFails(updateDoc(ref(as('bob')), { isCompleted: true }));
    await assertSucceeds(updateDoc(ref(as('alice')), { isCompleted: true }));
    await assertSucceeds(getDoc(ref(env.unauthenticatedContext().firestore())));
    await assertFails(deleteDoc(ref(as('bob'))));
    await assertSucceeds(deleteDoc(ref(as('alice'))));
  });
});
