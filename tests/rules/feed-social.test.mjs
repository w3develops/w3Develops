// Firestore rules tests for the feed's social parts: follow requests for
// private accounts, likes, replies, and appeals. Run with:
//   npm run test:rules
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  Timestamp,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

const DAY = 24 * 60 * 60 * 1000;
let env;

const TOKENS = {
  alice: { email: 'alice@example.com', email_verified: true, firebase: { sign_in_provider: 'password' } },
  bob: { email: 'bob@example.com', email_verified: true, firebase: { sign_in_provider: 'password' } },
  carol: { email: 'carol@example.com', email_verified: true, firebase: { sign_in_provider: 'password' } },
  unverified: { email: 'unverified@example.com', email_verified: false, firebase: { sign_in_provider: 'password' } },
  mod: { email: 'mod@example.com', email_verified: true, moderator: true, firebase: { sign_in_provider: 'password' } },
};
const as = name => env.authenticatedContext(name, TOKENS[name]).firestore();
const anon = () => env.unauthenticatedContext().firestore();

function profile(name, extra = {}) {
  return { id: name, username: name, username_lowercase: name, profilePictureUrl: '', createdAt: Timestamp.fromMillis(Date.now() - 30 * DAY), followers: [], following: [], ...extra };
}

function post(authorId, extra = {}) {
  return { authorId, authorName: authorId, authorPhoto: '', text: 'Hello', topics: [], audience: 'public', status: 'visible', createdAt: Timestamp.now(), ...extra };
}

async function seed(write) {
  await env.withSecurityRulesDisabled(async context => write(context.firestore()));
}

async function readAsAdmin(path) {
  let data;
  await env.withSecurityRulesDisabled(async context => {
    data = (await getDoc(doc(context.firestore(), path))).data();
  });
  return data;
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-w3develops-social',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(async db => {
    for (const name of ['alice', 'bob', 'unverified', 'mod']) await setDoc(doc(db, 'users', name), profile(name));
    // Carol has a private account; Bob already follows her
    await setDoc(doc(db, 'users', 'carol'), profile('carol', { privateAccount: true, followers: ['bob'] }));
    await setDoc(doc(db, 'users', 'bob'), profile('bob', { following: ['carol'] }));
    await setDoc(doc(db, 'memberPosts', 'pub'), post('bob'));
    await setDoc(doc(db, 'memberPosts', 'carolPrivate'), post('carol', { audience: 'followers' }));
    await setDoc(doc(db, 'memberPosts', 'hidden'), post('bob', { status: 'hidden', hiddenBy: 'moderator' }));
  });
});

// ---- Follow requests ----

function follow(db, uid, targetId) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', uid), { following: arrayUnion(targetId) });
  batch.update(doc(db, 'users', targetId), { followers: arrayUnion(uid) });
  return batch.commit();
}

function askToFollow(db, uid, targetId, extra = {}) {
  return setDoc(doc(db, 'followRequests', `${targetId}_${uid}`), {
    fromId: uid, toId: targetId, fromName: uid, fromPhoto: '', createdAt: serverTimestamp(), ...extra,
  });
}

describe('private accounts and follow requests', () => {
  test('anyone can follow a public account directly', async () => {
    await assertSucceeds(follow(as('alice'), 'alice', 'bob'));
  });

  test('a private account cannot be followed directly', async () => {
    await assertFails(follow(as('alice'), 'alice', 'carol'));
  });

  test('accounts made private in feedPrefs before the profile flag are private too', async () => {
    await seed(db => setDoc(doc(db, 'users', 'bob', 'private', 'feedPrefs'), { privateAccount: true }));
    await assertFails(follow(as('alice'), 'alice', 'bob'));
  });

  test('the profile flag must be true or false', async () => {
    await assertFails(updateDoc(doc(as('alice'), 'users', 'alice'), { privateAccount: 'yes' }));
    await assertSucceeds(updateDoc(doc(as('alice'), 'users', 'alice'), { privateAccount: true }));
  });

  test('a verified member can ask to follow a private account', async () => {
    await assertSucceeds(askToFollow(as('alice'), 'alice', 'carol'));
  });

  test('a request needs the right name, a private target, and no block', async () => {
    await assertFails(askToFollow(as('alice'), 'alice', 'bob')); // bob is public
    await assertFails(askToFollow(as('alice'), 'alice', 'carol', { fromName: 'admin' }));
    await assertFails(askToFollow(as('alice'), 'bob', 'carol')); // as someone else
    await assertFails(setDoc(doc(as('alice'), 'followRequests', 'wrong_id'), { fromId: 'alice', toId: 'carol', fromName: 'alice', fromPhoto: '', createdAt: serverTimestamp() }));
    await assertFails(askToFollow(as('unverified'), 'unverified', 'carol'));
    await assertFails(askToFollow(as('bob'), 'bob', 'carol')); // already a follower
    await seed(db => setDoc(doc(db, 'users', 'carol', 'private', 'feedPrefs'), { blockedIds: ['alice'] }));
    await assertFails(askToFollow(as('alice'), 'alice', 'carol'));
  });

  test('only the two people on a request can read or remove it', async () => {
    await askToFollow(as('alice'), 'alice', 'carol');
    await assertSucceeds(getDoc(doc(as('alice'), 'followRequests', 'carol_alice')));
    await assertSucceeds(getDocs(query(collection(as('carol'), 'followRequests'), where('toId', '==', 'carol'))));
    await assertFails(getDoc(doc(as('bob'), 'followRequests', 'carol_alice')));
    await assertFails(getDocs(query(collection(as('bob'), 'followRequests'), where('toId', '==', 'carol'))));
    await assertFails(deleteDoc(doc(as('bob'), 'followRequests', 'carol_alice')));
    await assertSucceeds(deleteDoc(doc(as('alice'), 'followRequests', 'carol_alice')));
  });

  test('checking for a request that was never sent is allowed', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), 'followRequests', 'carol_alice')));
  });

  test('requests cannot be changed', async () => {
    await askToFollow(as('alice'), 'alice', 'carol');
    await assertFails(updateDoc(doc(as('carol'), 'followRequests', 'carol_alice'), { fromName: 'x' }));
  });

  test('the private account accepts by adding the follower and removing the request', async () => {
    await askToFollow(as('alice'), 'alice', 'carol');
    const db = as('carol');
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', 'carol'), { followers: arrayUnion('alice') });
    batch.delete(doc(db, 'followRequests', 'carol_alice'));
    await assertSucceeds(batch.commit());
    // Alice can now see Carol's followers-only posts
    await assertSucceeds(getDoc(doc(as('alice'), 'memberPosts', 'carolPrivate')));
  });

  test('a follower of a private account can still unfollow', async () => {
    const db = as('bob');
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', 'bob'), { following: arrayRemove('carol') });
    batch.update(doc(db, 'users', 'carol'), { followers: arrayRemove('bob') });
    await assertSucceeds(batch.commit());
  });
});

// ---- Likes ----

function like(db, uid, postId, change = 1) {
  const batch = writeBatch(db);
  const likeRef = doc(db, 'memberPosts', postId, 'likes', uid);
  if (change > 0) batch.set(likeRef, { createdAt: serverTimestamp() });
  else batch.delete(likeRef);
  batch.update(doc(db, 'memberPosts', postId), { likeCount: increment(change) });
  return batch.commit();
}

describe('likes', () => {
  test('a member can like and unlike a post they can see, and the count follows', async () => {
    await assertSucceeds(like(as('alice'), 'alice', 'pub'));
    assert((await readAsAdmin('memberPosts/pub')).likeCount === 1);
    await assertSucceeds(like(as('alice'), 'alice', 'pub', -1));
    assert((await readAsAdmin('memberPosts/pub')).likeCount === 0);
  });

  test('liking twice is refused', async () => {
    await like(as('alice'), 'alice', 'pub');
    await assertFails(like(as('alice'), 'alice', 'pub'));
  });

  test('the count cannot change without a like, or by more than one', async () => {
    await assertFails(updateDoc(doc(as('alice'), 'memberPosts', 'pub'), { likeCount: 10 }));
    await assertFails(updateDoc(doc(as('alice'), 'memberPosts', 'pub'), { likeCount: increment(1) }));
    const db = as('alice');
    const batch = writeBatch(db);
    batch.set(doc(db, 'memberPosts', 'pub', 'likes', 'alice'), { createdAt: serverTimestamp() });
    batch.update(doc(db, 'memberPosts', 'pub'), { likeCount: increment(2) });
    await assertFails(batch.commit());
  });

  test('a like without the count is refused', async () => {
    await assertFails(setDoc(doc(as('alice'), 'memberPosts', 'pub', 'likes', 'alice'), { createdAt: serverTimestamp() }));
  });

  test('liking as someone else is refused', async () => {
    const db = as('alice');
    const batch = writeBatch(db);
    batch.set(doc(db, 'memberPosts', 'pub', 'likes', 'bob'), { createdAt: serverTimestamp() });
    batch.update(doc(db, 'memberPosts', 'pub'), { likeCount: increment(1) });
    await assertFails(batch.commit());
  });

  test('posts you cannot see cannot be liked', async () => {
    await assertFails(like(as('alice'), 'alice', 'carolPrivate'));
    await assertFails(like(as('alice'), 'alice', 'hidden'));
    await assertSucceeds(like(as('bob'), 'bob', 'carolPrivate'));
  });

  test('visitors and unverified members cannot like', async () => {
    await assertFails(like(anon(), 'x', 'pub'));
    await assertFails(like(as('unverified'), 'unverified', 'pub'));
  });

  test('members read only their own likes', async () => {
    await like(as('alice'), 'alice', 'pub');
    await assertSucceeds(getDoc(doc(as('alice'), 'memberPosts', 'pub', 'likes', 'alice')));
    await assertFails(getDoc(doc(as('bob'), 'memberPosts', 'pub', 'likes', 'alice')));
    await assertFails(getDocs(collection(as('bob'), 'memberPosts', 'pub', 'likes')));
  });
});

// ---- Replies ----

function reply(db, uid, postId, replyId, extra = {}, limits) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'memberPosts', postId, 'replies', replyId), {
    authorId: uid, authorName: uid, authorPhoto: '', text: 'Nice work!', status: 'visible', createdAt: serverTimestamp(), ...extra,
  });
  if (limits !== null) {
    batch.set(doc(db, 'replyLimits', uid), limits ?? { windowStart: serverTimestamp(), count: 1, lastPostId: postId, lastReplyId: replyId });
  }
  return batch.commit();
}

describe('replies', () => {
  test('a verified member can reply to a post they can see', async () => {
    await assertSucceeds(reply(as('alice'), 'alice', 'pub', 'r1'));
    await assertSucceeds(reply(as('bob'), 'bob', 'carolPrivate', 'r2'));
  });

  test('replies must be counted, short, clean and in the member’s own name', async () => {
    await assertFails(reply(as('alice'), 'alice', 'pub', 'r1', {}, null));
    await assertFails(reply(as('alice'), 'alice', 'pub', 'r2', { text: '' }));
    await assertFails(reply(as('alice'), 'alice', 'pub', 'r3', { text: 'a'.repeat(501) }));
    await assertFails(reply(as('alice'), 'alice', 'pub', 'r4', { text: 'what the fuck' }));
    await assertFails(reply(as('alice'), 'alice', 'pub', 'r5', { authorName: 'admin' }));
    await assertFails(reply(as('alice'), 'alice', 'pub', 'r6', { status: 'hidden' }));
    await assertFails(reply(as('alice'), 'bob', 'pub', 'r7'));
  });

  test('no replying to posts you cannot see, or as a blocked or suspended member', async () => {
    await assertFails(reply(as('alice'), 'alice', 'carolPrivate', 'r1'));
    await assertFails(reply(as('alice'), 'alice', 'hidden', 'r2'));
    await assertFails(reply(as('unverified'), 'unverified', 'pub', 'r3'));
    await seed(db => setDoc(doc(db, 'users', 'bob', 'private', 'feedPrefs'), { blockedIds: ['alice'] }));
    await assertFails(reply(as('alice'), 'alice', 'pub', 'r4'));
    await seed(db => setDoc(doc(db, 'memberStandings', 'carol'), { warnings: 1, suspendedUntil: Timestamp.fromMillis(Date.now() + DAY), lastLogId: 'x', updatedAt: Timestamp.now() }));
    await assertFails(reply(as('carol'), 'carol', 'pub', 'r5'));
  });

  test('30 replies an hour, then a pause', async () => {
    await seed(db => setDoc(doc(db, 'replyLimits', 'alice'), { windowStart: Timestamp.now(), count: 30, lastPostId: 'pub', lastReplyId: 'old' }));
    const full = await readAsAdmin('replyLimits/alice');
    await assertFails(reply(as('alice'), 'alice', 'pub', 'r1', {}, { windowStart: full.windowStart, count: 31, lastPostId: 'pub', lastReplyId: 'r1' }));
    await seed(db => setDoc(doc(db, 'replyLimits', 'alice'), { windowStart: Timestamp.now(), count: 29, lastPostId: 'pub', lastReplyId: 'old' }));
    const almost = await readAsAdmin('replyLimits/alice');
    await assertSucceeds(reply(as('alice'), 'alice', 'pub', 'r2', {}, { windowStart: almost.windowStart, count: 30, lastPostId: 'pub', lastReplyId: 'r2' }));
  });

  test('visible replies are as public as their post', async () => {
    await reply(as('alice'), 'alice', 'pub', 'r1');
    await reply(as('bob'), 'bob', 'carolPrivate', 'r2');
    const visible = (db, postId) => getDocs(query(collection(db, 'memberPosts', postId, 'replies'), where('status', '==', 'visible'), orderBy('createdAt'), limit(50)));
    await assertSucceeds(visible(anon(), 'pub'));
    await assertSucceeds(visible(as('bob'), 'carolPrivate'));
    await assertFails(visible(as('alice'), 'carolPrivate'));
    await assertFails(getDocs(collection(anon(), 'memberPosts', 'pub', 'replies')));
  });

  test('a hidden reply is only for its author and moderators', async () => {
    await seed(db => setDoc(doc(db, 'memberPosts', 'pub', 'replies', 'h1'), { authorId: 'alice', authorName: 'alice', authorPhoto: '', text: 'x', status: 'hidden', hiddenBy: 'auto-check', createdAt: Timestamp.now() }));
    await assertFails(getDoc(doc(as('bob'), 'memberPosts', 'pub', 'replies', 'h1')));
    await assertSucceeds(getDoc(doc(as('alice'), 'memberPosts', 'pub', 'replies', 'h1')));
    await assertSucceeds(getDocs(query(collection(as('alice'), 'memberPosts', 'pub', 'replies'), where('authorId', '==', 'alice'), where('status', '==', 'hidden'))));
    await assertSucceeds(getDoc(doc(as('mod'), 'memberPosts', 'pub', 'replies', 'h1')));
  });

  test('the reply’s author and the post’s author can delete it; others cannot', async () => {
    await reply(as('alice'), 'alice', 'pub', 'r1');
    await reply(as('alice'), 'alice', 'pub', 'r2', {}, { windowStart: (await readAsAdmin('replyLimits/alice')).windowStart, count: 2, lastPostId: 'pub', lastReplyId: 'r2' });
    await assertFails(deleteDoc(doc(as('carol'), 'memberPosts', 'pub', 'replies', 'r1')));
    await assertSucceeds(deleteDoc(doc(as('alice'), 'memberPosts', 'pub', 'replies', 'r1')));
    await assertSucceeds(deleteDoc(doc(as('bob'), 'memberPosts', 'pub', 'replies', 'r2')));
  });

  test('the author can edit a reply’s text, marked as edited', async () => {
    await reply(as('alice'), 'alice', 'pub', 'r1');
    const ref = db => doc(db, 'memberPosts', 'pub', 'replies', 'r1');
    await assertFails(updateDoc(ref(as('alice')), { text: 'changed' })); // no updatedAt
    await assertFails(updateDoc(ref(as('bob')), { text: 'changed', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(as('alice')), { text: 'what the fuck', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(as('alice')), { text: '', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(as('alice')), { text: 'a'.repeat(501), updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(as('alice')), { text: 'ok', status: 'visible', authorName: 'admin', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref(as('alice')), { text: 'Saturday works, 10am?', updatedAt: serverTimestamp() }));
  });

  test('editing can’t un-hide a reply, and suspended members can’t edit', async () => {
    await reply(as('alice'), 'alice', 'pub', 'r1');
    const ref = db => doc(db, 'memberPosts', 'pub', 'replies', 'r1');
    await seed(db => updateDoc(ref(db), { status: 'hidden', hiddenBy: 'auto-check' }));
    await assertFails(updateDoc(ref(as('alice')), { text: 'fixed', status: 'visible', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref(as('alice')), { text: 'fixed', updatedAt: serverTimestamp() }));
    await seed(db => setDoc(doc(db, 'memberStandings', 'alice'), { warnings: 1, suspendedUntil: Timestamp.fromMillis(Date.now() + DAY), lastLogId: 'x', updatedAt: Timestamp.now() }));
    await assertFails(updateDoc(ref(as('alice')), { text: 'again', updatedAt: serverTimestamp() }));
  });

  test('moderators hide, restore and delete replies with a log entry', async () => {
    await reply(as('alice'), 'alice', 'pub', 'r1');
    const db = as('mod');
    const logEntry = (action, extra = {}) => ({ actorId: 'mod', action, targetUserId: 'alice', postId: 'pub', replyId: 'r1', note: '', createdAt: serverTimestamp(), ...extra });
    const hide = writeBatch(db);
    hide.set(doc(db, 'moderationLog', 'log1'), logEntry('hide'));
    hide.update(doc(db, 'memberPosts', 'pub', 'replies', 'r1'), { status: 'hidden', hiddenBy: 'moderator', moderationLogId: 'log1' });
    await assertSucceeds(hide.commit());

    const noLog = updateDoc(doc(db, 'memberPosts', 'pub', 'replies', 'r1'), { status: 'visible', moderationLogId: 'missing' });
    await assertFails(noLog);

    const wrongReply = writeBatch(db);
    wrongReply.set(doc(db, 'moderationLog', 'log2'), logEntry('restore', { replyId: 'other' }));
    wrongReply.update(doc(db, 'memberPosts', 'pub', 'replies', 'r1'), { status: 'visible', hiddenBy: null, moderationLogId: 'log2' });
    await assertFails(wrongReply.commit());

    const remove = writeBatch(db);
    remove.set(doc(db, 'moderationLog', 'delete-pub-r1'), logEntry('delete'));
    remove.delete(doc(db, 'memberPosts', 'pub', 'replies', 'r1'));
    await assertSucceeds(remove.commit());
  });

  test('a moderator deleting a reply must log it under the reply’s name', async () => {
    await reply(as('alice'), 'alice', 'pub', 'r1');
    const db = as('mod');
    const batch = writeBatch(db);
    batch.set(doc(db, 'moderationLog', 'delete-pub'), { actorId: 'mod', action: 'delete', targetUserId: 'alice', postId: 'pub', replyId: 'r1', note: '', createdAt: serverTimestamp() });
    batch.delete(doc(db, 'memberPosts', 'pub', 'replies', 'r1'));
    await assertFails(batch.commit());
  });

  test('a reply can be reported once per member, naming its real author', async () => {
    await reply(as('alice'), 'alice', 'pub', 'r1');
    const report = (db, id, extra = {}) => setDoc(doc(db, 'reports', id), {
      reporterId: 'bob', reportedUserId: 'alice', postId: 'pub', replyId: 'r1', reason: 'spam', details: '', page: '/feed', status: 'open', createdAt: serverTimestamp(), ...extra,
    });
    await assertFails(report(as('bob'), 'pub_r1_bob', { reportedUserId: 'carol' }));
    await assertFails(report(as('bob'), 'pub_bob'));
    await assertSucceeds(report(as('bob'), 'pub_r1_bob'));
  });
});

// ---- Appeals ----

describe('appeals', () => {
  beforeEach(async () => {
    await seed(async db => {
      await setDoc(doc(db, 'moderationLog', 'hideLog'), { actorId: 'mod', action: 'hide', targetUserId: 'bob', postId: 'hidden', note: '', createdAt: Timestamp.now() });
      await setDoc(doc(db, 'moderationLog', 'warnLog'), { actorId: 'mod', action: 'warn', targetUserId: 'bob', note: 'Be kind', createdAt: Timestamp.now() });
      await setDoc(doc(db, 'moderationLog', 'restoreLog'), { actorId: 'mod', action: 'restore', targetUserId: 'bob', postId: 'pub', note: '', createdAt: Timestamp.now() });
    });
  });

  const appeal = (db, logId, extra = {}) => setDoc(doc(db, 'appeals', logId), {
    userId: 'bob', action: 'hide', postId: 'hidden', text: 'It was a joke between friends', status: 'open', createdAt: serverTimestamp(), ...extra,
  });

  test('a member can appeal an action about them, once', async () => {
    await assertSucceeds(appeal(as('bob'), 'hideLog'));
    await assertFails(appeal(as('bob'), 'hideLog'));
    await assertSucceeds(setDoc(doc(as('bob'), 'appeals', 'warnLog'), { userId: 'bob', action: 'warn', text: 'Sorry', status: 'open', createdAt: serverTimestamp() }));
  });

  test('the appeal must match the action, the member and the post', async () => {
    await assertFails(appeal(as('alice'), 'hideLog', { userId: 'alice' }));
    await assertFails(appeal(as('bob'), 'hideLog', { action: 'warn' }));
    await assertFails(appeal(as('bob'), 'hideLog', { postId: 'pub' }));
    await assertFails(appeal(as('bob'), 'hideLog', { status: 'reversed' }));
    await assertFails(appeal(as('bob'), 'hideLog', { text: '' }));
    await assertFails(appeal(as('bob'), 'hideLog', { text: 'a'.repeat(1001) }));
    await assertFails(appeal(as('bob'), 'restoreLog', { action: 'restore', postId: 'pub' }));
    await assertFails(appeal(as('bob'), 'missingLog'));
  });

  test('a member can appeal a hidden reply, naming the right reply', async () => {
    await seed(db => setDoc(doc(db, 'moderationLog', 'replyHide'), { actorId: 'mod', action: 'hide', targetUserId: 'bob', postId: 'pub', replyId: 'r9', note: '', createdAt: Timestamp.now() }));
    const replyAppeal = (extra = {}) => setDoc(doc(as('bob'), 'appeals', 'replyHide'), {
      userId: 'bob', action: 'hide', postId: 'pub', replyId: 'r9', text: 'Please look again', status: 'open', createdAt: serverTimestamp(), ...extra,
    });
    await assertFails(replyAppeal({ replyId: 'other' }));
    await assertSucceeds(replyAppeal());
  });

  test('a post appeal cannot claim a reply', async () => {
    await assertFails(appeal(as('bob'), 'hideLog', { replyId: 'r1' }));
  });

  test('only the member and moderators can read an appeal', async () => {
    await appeal(as('bob'), 'hideLog');
    await assertSucceeds(getDoc(doc(as('bob'), 'appeals', 'hideLog')));
    await assertSucceeds(getDoc(doc(as('bob'), 'appeals', 'warnLog'))); // not sent yet
    await assertFails(getDoc(doc(as('alice'), 'appeals', 'hideLog')));
    await assertSucceeds(getDocs(query(collection(as('mod'), 'appeals'), where('status', '==', 'open'))));
    await assertFails(getDocs(query(collection(as('alice'), 'appeals'), where('status', '==', 'open'))));
  });

  test('moderators answer an appeal once; members cannot', async () => {
    await appeal(as('bob'), 'hideLog');
    const answer = (db, extra = {}) => updateDoc(doc(db, 'appeals', 'hideLog'), { status: 'reversed', response: 'Restored', closedBy: 'mod', closedAt: serverTimestamp(), ...extra });
    await assertFails(answer(as('bob'), { closedBy: 'bob' }));
    await assertFails(answer(as('mod'), { closedBy: 'alice' }));
    await assertFails(answer(as('mod'), { status: 'open' }));
    await assertFails(updateDoc(doc(as('mod'), 'appeals', 'hideLog'), { text: 'changed' }));
    await assertSucceeds(answer(as('mod')));
    await assertFails(answer(as('mod'), { status: 'upheld' }));
    await assertFails(deleteDoc(doc(as('mod'), 'appeals', 'hideLog')));
  });

  test('moderators record which warning and suspension a member can appeal', async () => {
    const db = as('mod');
    const batch = writeBatch(db);
    batch.set(doc(db, 'moderationLog', 'warn2'), { actorId: 'mod', action: 'warn', targetUserId: 'alice', note: 'Please be kind', createdAt: serverTimestamp() });
    batch.set(doc(db, 'memberStandings', 'alice'), { warnings: 1, lastWarning: 'Please be kind', suspendedUntil: null, lastLogId: 'warn2', warnLogId: 'warn2', updatedAt: serverTimestamp() });
    await assertSucceeds(batch.commit());
  });
});

function assert(condition) {
  if (!condition) throw new Error('Assertion failed');
}
