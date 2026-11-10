// Firestore rules tests for member posts, their moderation, post reports,
// feed settings (mute and block) and account age. Run with:
//   npm run test:rules
// which starts the Firestore emulator and runs every file in tests/rules.
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

const BLOCKED_WORDS = readBlockedWords();

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

let env;

// Each member's token: verified email sign-in unless said otherwise
const TOKENS = {
  alice: { email: 'alice@example.com', email_verified: true, firebase: { sign_in_provider: 'password' } },
  bob: { email: 'bob@example.com', email_verified: true, firebase: { sign_in_provider: 'password' } },
  carol: { email: 'carol@example.com', email_verified: true, firebase: { sign_in_provider: 'password' } },
  newbie: { email: 'newbie@example.com', email_verified: true, firebase: { sign_in_provider: 'password' } },
  unverified: { email: 'unverified@example.com', email_verified: false, firebase: { sign_in_provider: 'password' } },
  mod: { email: 'mod@example.com', email_verified: true, moderator: true, firebase: { sign_in_provider: 'password' } },
};

const as = name => env.authenticatedContext(name, TOKENS[name]).firestore();
const anon = () => env.unauthenticatedContext().firestore();

function readBlockedWords() {
  // The list lives in TypeScript; pull the strings out of the array literal
  const source = readFileSync(new URL('../../src/lib/member-posts.ts', import.meta.url), 'utf8');
  const list = source.match(/BLOCKED_WORDS = \[([\s\S]*?)\];/)[1];
  return [...list.matchAll(/'([^']+)'/g)].map(match => match[1]);
}

function profile(name, ageMs) {
  return { id: name, username: name, username_lowercase: name, profilePictureUrl: '', createdAt: Timestamp.fromMillis(Date.now() - ageMs), followers: [], following: [] };
}

function post(authorId, extra = {}) {
  return {
    authorId,
    authorName: authorId,
    authorPhoto: '',
    text: 'Just shipped my first React app!',
    topics: ['react'],
    status: 'visible',
    createdAt: serverTimestamp(),
    ...extra,
  };
}

/** Creates a post the way the feed does: the post and its postLimits count in one save */
function createPost(db, uid, postId, extra = {}, limits) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'memberPosts', postId), post(uid, extra));
  if (limits !== null) {
    batch.set(doc(db, 'postLimits', uid), limits ?? { windowStart: serverTimestamp(), count: 1, lastPostId: postId });
  }
  return batch.commit();
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
    projectId: 'demo-w3develops-rules',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(async db => {
    for (const name of ['alice', 'bob', 'carol', 'unverified', 'mod']) {
      await setDoc(doc(db, 'users', name), profile(name, 30 * DAY));
    }
    await setDoc(doc(db, 'users', 'newbie'), profile('newbie', 2 * HOUR));
    await setDoc(doc(db, 'memberPosts', 'visible1'), { ...post('bob'), createdAt: Timestamp.now() });
    await setDoc(doc(db, 'memberPosts', 'hidden1'), { ...post('bob'), status: 'hidden', hiddenBy: 'reports', createdAt: Timestamp.now() });
  });
});

describe('reading posts', () => {
  test('anyone can read a visible post', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'memberPosts', 'visible1')));
  });

  test('anyone can list visible posts', async () => {
    await assertSucceeds(getDocs(query(collection(anon(), 'memberPosts'), where('status', '==', 'visible'))));
  });

  test('listing without the visible filter is refused', async () => {
    await assertFails(getDocs(collection(anon(), 'memberPosts')));
    await assertFails(getDocs(collection(as('alice'), 'memberPosts')));
  });

  test('a hidden post is refused to visitors and other members', async () => {
    await assertFails(getDoc(doc(anon(), 'memberPosts', 'hidden1')));
    await assertFails(getDoc(doc(as('alice'), 'memberPosts', 'hidden1')));
  });

  test('the author can read their hidden post', async () => {
    await assertSucceeds(getDoc(doc(as('bob'), 'memberPosts', 'hidden1')));
    await assertSucceeds(getDocs(query(collection(as('bob'), 'memberPosts'), where('authorId', '==', 'bob'))));
  });

  test('moderators can read and list hidden posts', async () => {
    await assertSucceeds(getDoc(doc(as('mod'), 'memberPosts', 'hidden1')));
    await assertSucceeds(getDocs(query(collection(as('mod'), 'memberPosts'), where('status', '==', 'hidden'))));
  });
});

describe('creating posts', () => {
  test('a verified member with an older account can post', async () => {
    await assertSucceeds(createPost(as('alice'), 'alice', 'p1'));
  });

  test('a post with a link and no topics is fine', async () => {
    await assertSucceeds(createPost(as('alice'), 'alice', 'p1', { topics: [], linkUrl: 'https://github.com/w3develops' }));
  });

  test('visitors cannot post', async () => {
    await assertFails(createPost(anon(), 'alice', 'p1'));
  });

  test('an unverified email cannot post', async () => {
    await assertFails(createPost(as('unverified'), 'unverified', 'p1'));
  });

  test('an account under a day old cannot post', async () => {
    await assertFails(createPost(as('newbie'), 'newbie', 'p1'));
  });

  test('an account with no createdAt cannot post', async () => {
    await seed(db => updateDoc(doc(db, 'users', 'alice'), { createdAt: deleteField() }));
    await assertFails(createPost(as('alice'), 'alice', 'p1'));
  });

  test('posting as someone else is refused', async () => {
    await assertFails(createPost(as('alice'), 'alice', 'p1', { authorId: 'bob', authorName: 'bob' }));
  });

  test('a made-up author name or photo is refused', async () => {
    await assertFails(createPost(as('alice'), 'alice', 'p1', { authorName: 'admin' }));
    await assertFails(createPost(as('alice'), 'alice', 'p1', { authorPhoto: 'https://example.com/x.png' }));
  });

  test('a post cannot start hidden or carry moderation fields', async () => {
    await assertFails(createPost(as('alice'), 'alice', 'p1', { status: 'hidden' }));
    await assertFails(createPost(as('alice'), 'alice', 'p2', { moderationLogId: 'x' }));
  });

  test('a backdated post is refused', async () => {
    await assertFails(createPost(as('alice'), 'alice', 'p1', { createdAt: Timestamp.fromMillis(Date.now() - DAY) }));
  });

  test('empty and too-long text are refused', async () => {
    await assertFails(createPost(as('alice'), 'alice', 'p1', { text: '' }));
    await assertFails(createPost(as('alice'), 'alice', 'p2', { text: 'a'.repeat(501) }));
    await assertSucceeds(createPost(as('alice'), 'alice', 'p3', { text: 'a'.repeat(500) }));
  });

  test('topics must be at most 3 lowercase words', async () => {
    await assertFails(createPost(as('alice'), 'alice', 'p1', { topics: ['a', 'b', 'c', 'd'] }));
    await assertFails(createPost(as('alice'), 'alice', 'p2', { topics: ['React'] }));
    await assertFails(createPost(as('alice'), 'alice', 'p3', { topics: ['has space'] }));
    await assertFails(createPost(as('alice'), 'alice', 'p4', { topics: 'react' }));
    await assertSucceeds(createPost(as('alice'), 'alice', 'p5', { topics: ['react', 'career-change', 'js'] }));
  });

  test('links must be https', async () => {
    await assertFails(createPost(as('alice'), 'alice', 'p1', { linkUrl: 'http://example.com' }));
    await assertFails(createPost(as('alice'), 'alice', 'p2', { linkUrl: 'javascript:alert(1)' }));
  });

  test('every blocked word is refused, in any case', async () => {
    let n = 0;
    for (const word of BLOCKED_WORDS) {
      await assertFails(createPost(as('alice'), 'alice', `w${n++}`, { text: `well ${word} there` }));
      await assertFails(createPost(as('alice'), 'alice', `w${n++}`, { text: `${word.toUpperCase()}!` }));
    }
  });

  test('blocked words are matched as whole words only', async () => {
    await assertSucceeds(createPost(as('alice'), 'alice', 'p1', { text: 'Shitake mushrooms in Scunthorpe, a classic' }));
  });

  test('a blocked word on another line is still found', async () => {
    await assertFails(createPost(as('alice'), 'alice', 'p1', { text: 'hello\nfuck' }));
  });

  test('a suspended member cannot post', async () => {
    await seed(db => setDoc(doc(db, 'memberStandings', 'alice'), { warnings: 1, suspendedUntil: Timestamp.fromMillis(Date.now() + DAY), lastLogId: 'l', updatedAt: Timestamp.now() }));
    await assertFails(createPost(as('alice'), 'alice', 'p1'));
  });

  test('a member whose suspension ended can post', async () => {
    await seed(db => setDoc(doc(db, 'memberStandings', 'alice'), { warnings: 1, suspendedUntil: Timestamp.fromMillis(Date.now() - HOUR), lastLogId: 'l', updatedAt: Timestamp.now() }));
    await assertSucceeds(createPost(as('alice'), 'alice', 'p1'));
  });

  test('a warned but not suspended member can post', async () => {
    await seed(db => setDoc(doc(db, 'memberStandings', 'alice'), { warnings: 2, suspendedUntil: null, lastLogId: 'l', updatedAt: Timestamp.now() }));
    await assertSucceeds(createPost(as('alice'), 'alice', 'p1'));
  });
});

describe('the hourly post limit', () => {
  test('a post must be counted in the same save', async () => {
    await assertFails(createPost(as('alice'), 'alice', 'p1', {}, null));
  });

  test('the count goes up by one within the hour', async () => {
    await seed(db => setDoc(doc(db, 'postLimits', 'alice'), { windowStart: Timestamp.fromMillis(Date.now() - 10 * 60 * 1000), count: 2, lastPostId: 'old' }));
    const { windowStart } = await readAsAdmin('postLimits/alice');
    await assertFails(createPost(as('alice'), 'alice', 'p1', {}, { windowStart, count: 2, lastPostId: 'p1' }));
    await assertFails(createPost(as('alice'), 'alice', 'p1', {}, { windowStart, count: 1, lastPostId: 'p1' }));
    await assertSucceeds(createPost(as('alice'), 'alice', 'p1', {}, { windowStart, count: 3, lastPostId: 'p1' }));
  });

  test('a sixth post in the hour is refused', async () => {
    await seed(db => setDoc(doc(db, 'postLimits', 'alice'), { windowStart: Timestamp.fromMillis(Date.now() - 10 * 60 * 1000), count: 5, lastPostId: 'old' }));
    const { windowStart } = await readAsAdmin('postLimits/alice');
    await assertFails(createPost(as('alice'), 'alice', 'p1', {}, { windowStart, count: 6, lastPostId: 'p1' }));
  });

  test('the window cannot be restarted early', async () => {
    await seed(db => setDoc(doc(db, 'postLimits', 'alice'), { windowStart: Timestamp.fromMillis(Date.now() - 10 * 60 * 1000), count: 5, lastPostId: 'old' }));
    await assertFails(createPost(as('alice'), 'alice', 'p1'));
  });

  test('a new window starts after an hour', async () => {
    await seed(db => setDoc(doc(db, 'postLimits', 'alice'), { windowStart: Timestamp.fromMillis(Date.now() - 2 * HOUR), count: 5, lastPostId: 'old' }));
    await assertSucceeds(createPost(as('alice'), 'alice', 'p1'));
  });

  test('the count cannot be changed without a new post', async () => {
    await assertFails(setDoc(doc(as('alice'), 'postLimits', 'alice'), { windowStart: serverTimestamp(), count: 1, lastPostId: 'nothing' }));
  });

  test('re-creating a deleted post needs a new count', async () => {
    await assertSucceeds(createPost(as('alice'), 'alice', 'p1'));
    await assertSucceeds(deleteDoc(doc(as('alice'), 'memberPosts', 'p1')));
    await assertFails(createPost(as('alice'), 'alice', 'p1', {}, null));
  });

  test("members cannot read or write someone else's count", async () => {
    await seed(db => setDoc(doc(db, 'postLimits', 'bob'), { windowStart: Timestamp.now(), count: 1, lastPostId: 'visible1' }));
    await assertFails(getDoc(doc(as('alice'), 'postLimits', 'bob')));
    await assertSucceeds(getDoc(doc(as('bob'), 'postLimits', 'bob')));
  });
});

describe('editing and deleting posts', () => {
  test('authors can edit the text, topics and link', async () => {
    await assertSucceeds(updateDoc(doc(as('bob'), 'memberPosts', 'visible1'), { text: 'Edited', topics: ['js'], linkUrl: 'https://example.com', updatedAt: serverTimestamp() }));
  });

  test('an edit must set updatedAt to now', async () => {
    await assertFails(updateDoc(doc(as('bob'), 'memberPosts', 'visible1'), { text: 'Edited' }));
  });

  test('an edit cannot add a blocked word', async () => {
    await assertFails(updateDoc(doc(as('bob'), 'memberPosts', 'visible1'), { text: 'oh shit', updatedAt: serverTimestamp() }));
  });

  test('authors cannot unhide their post or change who wrote it', async () => {
    await assertFails(updateDoc(doc(as('bob'), 'memberPosts', 'hidden1'), { status: 'visible', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as('bob'), 'memberPosts', 'visible1'), { authorId: 'alice', updatedAt: serverTimestamp() }));
  });

  test("others cannot edit a member's post", async () => {
    await assertFails(updateDoc(doc(as('alice'), 'memberPosts', 'visible1'), { text: 'Mine now', updatedAt: serverTimestamp() }));
  });

  test('a suspended author cannot edit', async () => {
    await seed(db => setDoc(doc(db, 'memberStandings', 'bob'), { warnings: 1, suspendedUntil: Timestamp.fromMillis(Date.now() + DAY), lastLogId: 'l', updatedAt: Timestamp.now() }));
    await assertFails(updateDoc(doc(as('bob'), 'memberPosts', 'visible1'), { text: 'Edited', updatedAt: serverTimestamp() }));
  });

  test('authors can delete their own posts, others cannot', async () => {
    await assertFails(deleteDoc(doc(as('alice'), 'memberPosts', 'visible1')));
    await assertSucceeds(deleteDoc(doc(as('bob'), 'memberPosts', 'visible1')));
  });
});

/** A moderator's action and its log entry in one save */
function moderate(db, logId, log, change) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'moderationLog', logId), { actorId: 'mod', targetUserId: 'bob', note: '', createdAt: serverTimestamp(), ...log });
  change(batch);
  return batch.commit();
}

describe('moderating posts', () => {
  test('a moderator can hide a post with a log entry', async () => {
    const db = as('mod');
    await assertSucceeds(moderate(db, 'l1', { action: 'hide', postId: 'visible1' }, b =>
      b.update(doc(db, 'memberPosts', 'visible1'), { status: 'hidden', hiddenBy: 'moderator', moderationLogId: 'l1' })));
  });

  test('hiding without a log entry is refused', async () => {
    await assertFails(updateDoc(doc(as('mod'), 'memberPosts', 'visible1'), { status: 'hidden', hiddenBy: 'moderator', moderationLogId: 'l1' }));
  });

  test("the log entry must be about this post and this action", async () => {
    const db = as('mod');
    await assertFails(moderate(db, 'l1', { action: 'hide', postId: 'other' }, b =>
      b.update(doc(db, 'memberPosts', 'visible1'), { status: 'hidden', hiddenBy: 'moderator', moderationLogId: 'l1' })));
    await assertFails(moderate(db, 'l2', { action: 'restore', postId: 'visible1' }, b =>
      b.update(doc(db, 'memberPosts', 'visible1'), { status: 'hidden', hiddenBy: 'moderator', moderationLogId: 'l2' })));
  });

  test('a moderator can restore a hidden post', async () => {
    const db = as('mod');
    await assertSucceeds(moderate(db, 'l1', { action: 'restore', postId: 'hidden1' }, b =>
      b.update(doc(db, 'memberPosts', 'hidden1'), { status: 'visible', hiddenBy: deleteField(), moderationLogId: 'l1' })));
  });

  test('moderators cannot edit what a post says', async () => {
    const db = as('mod');
    await assertFails(moderate(db, 'l1', { action: 'hide', postId: 'visible1' }, b =>
      b.update(doc(db, 'memberPosts', 'visible1'), { status: 'hidden', hiddenBy: 'moderator', moderationLogId: 'l1', text: 'changed' })));
  });

  test('members without the claim cannot hide posts', async () => {
    const db = as('alice');
    await assertFails(moderate(db, 'l1', { action: 'hide', postId: 'visible1', actorId: 'alice' }, b =>
      b.update(doc(db, 'memberPosts', 'visible1'), { status: 'hidden', hiddenBy: 'moderator', moderationLogId: 'l1' })));
  });

  test('a moderator can delete a post with a delete log entry', async () => {
    const db = as('mod');
    await assertFails(deleteDoc(doc(db, 'memberPosts', 'visible1')));
    await assertFails(moderate(db, 'l1', { action: 'delete', postId: 'visible1' }, b => b.delete(doc(db, 'memberPosts', 'visible1'))));
    await assertSucceeds(moderate(db, 'delete-visible1', { action: 'delete', postId: 'visible1' }, b => b.delete(doc(db, 'memberPosts', 'visible1'))));
  });
});

describe('the moderation log', () => {
  test('only moderators can read it', async () => {
    await seed(db => setDoc(doc(db, 'moderationLog', 'l0'), { actorId: 'mod', action: 'warn', targetUserId: 'bob', note: '', createdAt: Timestamp.now() }));
    await assertFails(getDoc(doc(as('bob'), 'moderationLog', 'l0')));
    await assertFails(getDocs(collection(anon(), 'moderationLog')));
    await assertSucceeds(getDocs(collection(as('mod'), 'moderationLog')));
  });

  test('entries must name the moderator who wrote them', async () => {
    await assertFails(setDoc(doc(as('mod'), 'moderationLog', 'l1'), { actorId: 'someone', action: 'dismiss', targetUserId: 'bob', note: '', createdAt: serverTimestamp() }));
    await assertSucceeds(setDoc(doc(as('mod'), 'moderationLog', 'l1'), { actorId: 'mod', action: 'dismiss', targetUserId: 'bob', postId: 'visible1', note: 'Not spam', createdAt: serverTimestamp() }));
  });

  test('only the known actions are accepted, and system entries are server-only', async () => {
    await assertFails(setDoc(doc(as('mod'), 'moderationLog', 'l1'), { actorId: 'mod', action: 'ban-forever', targetUserId: 'bob', note: '', createdAt: serverTimestamp() }));
    await assertFails(setDoc(doc(as('mod'), 'moderationLog', 'l2'), { actorId: 'mod', action: 'auto-hide', targetUserId: 'bob', note: '', createdAt: serverTimestamp() }));
  });

  test('entries cannot be changed or deleted, even by moderators', async () => {
    await seed(db => setDoc(doc(db, 'moderationLog', 'l0'), { actorId: 'mod', action: 'warn', targetUserId: 'bob', note: '', createdAt: Timestamp.now() }));
    await assertFails(updateDoc(doc(as('mod'), 'moderationLog', 'l0'), { note: 'edited' }));
    await assertFails(deleteDoc(doc(as('mod'), 'moderationLog', 'l0')));
  });

  test('members cannot write entries', async () => {
    await assertFails(setDoc(doc(as('alice'), 'moderationLog', 'l1'), { actorId: 'alice', action: 'warn', targetUserId: 'bob', note: '', createdAt: serverTimestamp() }));
  });
});

describe('warnings and suspensions', () => {
  const standing = (logId, extra = {}) => ({ warnings: 1, lastWarning: 'Please keep it kind', suspendedUntil: null, lastLogId: logId, updatedAt: serverTimestamp(), ...extra });

  test('a moderator can warn a member with a log entry', async () => {
    const db = as('mod');
    await assertSucceeds(moderate(db, 'l1', { action: 'warn' }, b => b.set(doc(db, 'memberStandings', 'bob'), standing('l1'))));
  });

  test('a moderator can suspend a member with a log entry', async () => {
    const db = as('mod');
    await assertSucceeds(moderate(db, 'l1', { action: 'suspend' }, b =>
      b.set(doc(db, 'memberStandings', 'bob'), standing('l1', { suspendedUntil: Timestamp.fromMillis(Date.now() + 7 * DAY) }))));
  });

  test('a standing change needs a matching log entry', async () => {
    const db = as('mod');
    await assertFails(setDoc(doc(db, 'memberStandings', 'bob'), standing('l1')));
    await assertFails(moderate(db, 'l2', { action: 'warn', targetUserId: 'carol' }, b => b.set(doc(db, 'memberStandings', 'bob'), standing('l2'))));
    await assertFails(moderate(db, 'l3', { action: 'hide', postId: 'x' }, b => b.set(doc(db, 'memberStandings', 'bob'), standing('l3'))));
  });

  test('members can read their own standing only', async () => {
    await seed(db => setDoc(doc(db, 'memberStandings', 'bob'), { warnings: 1, lastLogId: 'l', updatedAt: Timestamp.now() }));
    await assertSucceeds(getDoc(doc(as('bob'), 'memberStandings', 'bob')));
    await assertFails(getDoc(doc(as('alice'), 'memberStandings', 'bob')));
    await assertSucceeds(getDoc(doc(as('mod'), 'memberStandings', 'bob')));
  });

  test('members cannot clear their own warnings', async () => {
    await seed(db => setDoc(doc(db, 'memberStandings', 'bob'), { warnings: 1, lastLogId: 'l', updatedAt: Timestamp.now() }));
    await assertFails(updateDoc(doc(as('bob'), 'memberStandings', 'bob'), { warnings: 0 }));
    await assertFails(deleteDoc(doc(as('bob'), 'memberStandings', 'bob')));
  });
});

describe('reporting posts', () => {
  const report = (reporterId, extra = {}) => ({
    reporterId,
    reportedUserId: 'bob',
    postId: 'visible1',
    reason: 'spam',
    details: '',
    page: '/feed',
    status: 'open',
    createdAt: serverTimestamp(),
    ...extra,
  });

  test('a verified member can report a post once', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'reports', 'visible1_alice'), report('alice')));
    await assertFails(setDoc(doc(as('alice'), 'reports', 'visible1_alice'), report('alice', { reason: 'unsafe' })));
  });

  test('the report ID must be the post and the reporter', async () => {
    await assertFails(setDoc(doc(as('alice'), 'reports', 'visible1_carol'), report('alice')));
    await assertFails(setDoc(doc(as('alice'), 'reports', 'random'), report('alice')));
  });

  test("the reported member must be the post's author", async () => {
    await assertFails(setDoc(doc(as('alice'), 'reports', 'visible1_alice'), report('alice', { reportedUserId: 'carol' })));
  });

  test('a missing post cannot be reported', async () => {
    await assertFails(setDoc(doc(as('alice'), 'reports', 'nope_alice'), report('alice', { postId: 'nope' })));
  });

  test('unverified members cannot report posts', async () => {
    await assertFails(setDoc(doc(as('unverified'), 'reports', 'visible1_unverified'), report('unverified')));
  });

  test('the post reasons are accepted', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'reports', 'visible1_alice'), report('alice', { reason: 'off-topic' })));
    await assertSucceeds(setDoc(doc(as('carol'), 'reports', 'visible1_carol'), report('carol', { reason: 'unsafe' })));
    await assertFails(setDoc(doc(as('mod'), 'reports', 'visible1_mod'), report('mod', { reason: 'boring' })));
  });

  test('profile reports without a post still work', async () => {
    const { postId, ...profileReport } = report('alice', { reason: 'impersonation', page: '/users/bob' });
    void postId;
    await assertSucceeds(setDoc(doc(as('alice'), 'reports', 'anyid'), profileReport));
  });

  test('only moderators can read reports', async () => {
    await seed(db => setDoc(doc(db, 'reports', 'visible1_alice'), { ...report('alice'), createdAt: Timestamp.now() }));
    await assertFails(getDoc(doc(as('alice'), 'reports', 'visible1_alice')));
    await assertFails(getDoc(doc(as('bob'), 'reports', 'visible1_alice')));
    await assertSucceeds(getDocs(query(collection(as('mod'), 'reports'), where('status', '==', 'open'))));
  });

  test('moderators can close an open report, members cannot', async () => {
    await seed(db => setDoc(doc(db, 'reports', 'visible1_alice'), { ...report('alice'), createdAt: Timestamp.now() }));
    const close = name => updateDoc(doc(as(name), 'reports', 'visible1_alice'), { status: 'closed', closedBy: name, closedAt: serverTimestamp() });
    await assertFails(close('alice'));
    await assertSucceeds(close('mod'));
  });

  test('moderators cannot rewrite a report', async () => {
    await seed(db => setDoc(doc(db, 'reports', 'visible1_alice'), { ...report('alice'), createdAt: Timestamp.now() }));
    await assertFails(updateDoc(doc(as('mod'), 'reports', 'visible1_alice'), { status: 'closed', closedBy: 'mod', closedAt: serverTimestamp(), reason: 'other' }));
    await assertFails(deleteDoc(doc(as('mod'), 'reports', 'visible1_alice')));
  });
});

describe('feed settings: topics, mute and block', () => {
  test('members can save their own feed settings', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'users/alice/private/feedPrefs'), { topics: ['react'], mutedIds: ['bob'], blockedIds: [] }));
    await assertSucceeds(getDoc(doc(as('alice'), 'users/alice/private/feedPrefs')));
  });

  test("others cannot read or write a member's feed settings", async () => {
    await assertFails(setDoc(doc(as('bob'), 'users/alice/private/feedPrefs'), { mutedIds: [] }));
    await seed(db => setDoc(doc(db, 'users/alice/private/feedPrefs'), { blockedIds: ['bob'] }));
    await assertFails(getDoc(doc(as('bob'), 'users/alice/private/feedPrefs')));
  });

  test('unknown fields and other private docs are refused', async () => {
    await assertFails(setDoc(doc(as('alice'), 'users/alice/private/feedPrefs'), { isModerator: true }));
    await assertFails(setDoc(doc(as('alice'), 'users/alice/private/other'), { topics: [] }));
    await assertFails(setDoc(doc(as('alice'), 'users/alice/private/feedPrefs'), { topics: 'react' }));
  });

  test('notification settings still save', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'users/alice/private/notificationPrefs'), { follows: false }));
  });

  test('a blocked member cannot follow the member who blocked them', async () => {
    await seed(db => setDoc(doc(db, 'users/alice/private/feedPrefs'), { blockedIds: ['bob'] }));
    await assertFails(updateDoc(doc(as('bob'), 'users', 'alice'), { followers: arrayUnion('bob') }));
    await assertSucceeds(updateDoc(doc(as('carol'), 'users', 'alice'), { followers: arrayUnion('carol') }));
  });

  test('a member without feed settings can still be followed', async () => {
    await assertSucceeds(updateDoc(doc(as('bob'), 'users', 'alice'), { followers: arrayUnion('bob') }));
  });

  test('a blocked member can still unfollow', async () => {
    await seed(async db => {
      await updateDoc(doc(db, 'users', 'alice'), { followers: ['bob'] });
      await setDoc(doc(db, 'users/alice/private/feedPrefs'), { blockedIds: ['bob'] });
    });
    await assertSucceeds(updateDoc(doc(as('bob'), 'users', 'alice'), { followers: arrayRemove('bob') }));
  });

  test('blocking removes the member from your followers', async () => {
    await seed(db => updateDoc(doc(db, 'users', 'alice'), { followers: ['bob'] }));
    const db = as('alice');
    const batch = writeBatch(db);
    batch.set(doc(db, 'users/alice/private/feedPrefs'), { blockedIds: ['bob'] }, { merge: true });
    batch.update(doc(db, 'users', 'alice'), { followers: arrayRemove('bob'), following: arrayRemove('bob') });
    await assertSucceeds(batch.commit());
  });
});

describe('account age', () => {
  test('signup sets createdAt to now', async () => {
    const fresh = env.authenticatedContext('fresh', TOKENS.alice).firestore();
    await assertSucceeds(setDoc(doc(fresh, 'users', 'fresh'), { bio: '', createdAt: serverTimestamp() }));
  });

  test('a backdated createdAt at signup is refused', async () => {
    const fresh = env.authenticatedContext('fresh', TOKENS.alice).firestore();
    await assertFails(setDoc(doc(fresh, 'users', 'fresh'), { bio: '', createdAt: Timestamp.fromMillis(Date.now() - 30 * DAY) }));
  });

  test('members cannot change their createdAt', async () => {
    await assertFails(updateDoc(doc(as('newbie'), 'users', 'newbie'), { createdAt: Timestamp.fromMillis(Date.now() - 30 * DAY) }));
    await assertFails(updateDoc(doc(as('newbie'), 'users', 'newbie'), { createdAt: deleteField() }));
    await assertSucceeds(updateDoc(doc(as('newbie'), 'users', 'newbie'), { bio: 'Hi' }));
  });
});

describe('the moderation team list', () => {
  test('moderators can read it, members cannot', async () => {
    await seed(db => setDoc(doc(db, 'moderators', 'mod'), { username: 'mod', addedBy: 'mod', addedAt: Timestamp.now() }));
    await assertSucceeds(getDocs(collection(as('mod'), 'moderators')));
    await assertFails(getDocs(collection(as('alice'), 'moderators')));
    await assertFails(getDoc(doc(anon(), 'moderators', 'mod')));
  });

  test('nobody can write it from the browser, not even moderators', async () => {
    await assertFails(setDoc(doc(as('mod'), 'moderators', 'alice'), { username: 'alice', addedBy: 'mod', addedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(as('alice'), 'moderators', 'alice'), { username: 'alice', addedBy: 'alice', addedAt: serverTimestamp() }));
  });

  test('team changes are logged by the server only', async () => {
    await assertFails(setDoc(doc(as('mod'), 'moderationLog', 'l1'), { actorId: 'mod', action: 'add-moderator', targetUserId: 'alice', note: '', createdAt: serverTimestamp() }));
  });
});
