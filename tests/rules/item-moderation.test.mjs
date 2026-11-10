// Firestore rules tests for moderators editing and deleting members' items:
// study groups, group projects, book clubs, meetups, competitions, jobs and
// solo projects, with their tasks, check-ins, updates and entries.
// Run with npm run test:rules.
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { Timestamp, deleteDoc, doc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

let env;
const token = extra => ({ email_verified: true, firebase: { sign_in_provider: 'password' }, ...extra });
const asMod = () => env.authenticatedContext('mod', token({ moderator: true })).firestore();
const asMember = () => env.authenticatedContext('alice', token()).firestore();
const asOwner = () => env.authenticatedContext('owner', token()).firestore();

const now = Timestamp.now();
const group = { name: 'React Study', name_lowercase: 'react study', topic: 'React', description: 'Learn React', commitmentDays: ['Mon'], creatorId: 'owner', memberIds: ['owner', 'alice'], createdAt: now };

// Each item: its collection, document, owner field, a wording change a
// moderator may make, and a field they may not change
const ITEMS = {
  studyGroups: { data: group, owner: 'creatorId', edit: { name: 'React Basics', name_lowercase: 'react basics' }, parts: ['tasks', 'checkIns'] },
  groupProjects: { data: group, owner: 'creatorId', edit: { description: 'Cleaned up' }, parts: ['tasks', 'checkIns'] },
  bookClubs: { data: group, owner: 'creatorId', edit: { topic: 'Books' }, parts: ['tasks', 'checkIns'] },
  meetups: {
    data: { name: 'Meetup', name_lowercase: 'meetup', topic: 'JS', description: 'Hi', creatorId: 'owner', attendeeIds: ['owner', 'alice'], dateTime: now, timezone: 'UTC', locationType: 'Online', virtualLink: 'https://meet.example/x', createdAt: now },
    owner: 'creatorId', edit: { virtualLink: '' }, parts: ['updates', 'tasks', 'checkIns'],
  },
  competitions: {
    data: { name: 'Hack', name_lowercase: 'hack', description: 'd', rules: 'r', prize: 'p', creatorId: 'owner', startDate: now, endDate: Timestamp.fromMillis(Date.now() + 864e5), createdAt: now },
    owner: 'creatorId', edit: { prize: 'Bragging rights' }, parts: ['entries'],
  },
  jobs: {
    data: { title: 'Dev', title_lowercase: 'dev', companyName: 'Co', location: 'Remote', description: 'd', applyUrl: 'https://x', postedById: 'owner', postedByUsername: 'owner', createdAt: now },
    owner: 'postedById', edit: { description: 'No scams please' }, parts: [],
  },
  soloProjects: {
    data: { name: 'App', description: 'd', projectUrl: 'https://x', userId: 'owner', username: 'owner', createdAt: now },
    owner: 'userId', edit: { description: 'Edited' }, parts: [],
  },
};

function log(db, id, extra) {
  return [doc(db, 'moderationLog', id), { actorId: 'mod', targetUserId: 'owner', note: 'Breaks the Code of Conduct', createdAt: serverTimestamp(), ...extra }];
}

/** A moderator's edit and its log entry in one save */
function moderatorEdit(db, kind, change, logExtra = {}) {
  const batch = writeBatch(db);
  batch.set(...log(db, 'edit1', { action: 'edit-content', contentPath: `${kind}/item1`, ...logExtra }));
  batch.update(doc(db, kind, 'item1'), { ...change, moderationLogId: 'edit1' });
  return batch.commit();
}

/** A moderator's deletion of an item and its parts, with the log entry, in one save */
function moderatorDelete(db, kind, parts, logId = `delete-${kind}-item1`) {
  const batch = writeBatch(db);
  batch.set(...log(db, logId, { action: 'delete-content', contentPath: `${kind}/item1` }));
  batch.delete(doc(db, kind, 'item1'));
  for (const part of parts) batch.delete(doc(db, kind, 'item1', part, 'part1'));
  return batch.commit();
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-w3develops-items',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  });
});
after(async () => env?.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    for (const [kind, item] of Object.entries(ITEMS)) {
      await setDoc(doc(db, kind, 'item1'), item.data);
      for (const part of item.parts) {
        await setDoc(doc(db, kind, 'item1', part, 'part1'), { userId: 'alice', creatorId: 'alice', content: 'hi', type: 'daily', createdAt: now });
      }
    }
  });
});

for (const [kind, item] of Object.entries(ITEMS)) {
  describe(`moderating ${kind}`, () => {
    test('a moderator can edit the wording with a log entry', async () => {
      await assertSucceeds(moderatorEdit(asMod(), kind, item.edit));
    });

    test('an edit without a log entry is refused', async () => {
      await assertFails(updateDoc(doc(asMod(), kind, 'item1'), { ...item.edit, moderationLogId: 'edit1' }));
      await assertFails(updateDoc(doc(asMod(), kind, 'item1'), item.edit));
    });

    test('the log entry must name this item', async () => {
      await assertFails(moderatorEdit(asMod(), kind, item.edit, { contentPath: `${kind}/other` }));
      await assertFails(moderatorEdit(asMod(), kind, item.edit, { action: 'delete-content' }));
    });

    test("a moderator cannot change who owns it", async () => {
      await assertFails(moderatorEdit(asMod(), kind, { ...item.edit, [item.owner]: 'mod' }));
    });

    test('members without the claim cannot use the moderator path', async () => {
      const db = asMember();
      const batch = writeBatch(db);
      batch.set(...log(db, 'edit1', { action: 'edit-content', contentPath: `${kind}/item1`, actorId: 'alice' }));
      batch.update(doc(db, kind, 'item1'), { ...item.edit, moderationLogId: 'edit1' });
      await assertFails(batch.commit());
      await assertFails(deleteDoc(doc(db, kind, 'item1')));
    });

    test('a moderator can delete it, and its parts, with a log entry', async () => {
      await assertSucceeds(moderatorDelete(asMod(), kind, item.parts));
    });

    test('a deletion without its log entry is refused', async () => {
      await assertFails(deleteDoc(doc(asMod(), kind, 'item1')));
      await assertFails(moderatorDelete(asMod(), kind, [], `delete-${kind}-other`));
    });

    test('the owner can still delete it as before', async () => {
      await assertSucceeds(deleteDoc(doc(asOwner(), kind, 'item1')));
    });

    for (const part of item.parts) {
      test(`a moderator can delete one of its ${part} with its own log entry`, async () => {
        const db = asMod();
        const batch = writeBatch(db);
        batch.set(...log(db, `delete-${kind}-item1-${part}-part1`, { action: 'delete-content', contentPath: `${kind}/item1/${part}/part1`, targetUserId: 'alice' }));
        batch.delete(doc(db, kind, 'item1', part, 'part1'));
        await assertSucceeds(batch.commit());
      });

      test(`deleting one of its ${part} without a log entry is refused`, async () => {
        await assertFails(deleteDoc(doc(asMod(), kind, 'item1', part, 'part1')));
      });

      test(`leftover ${part} can be cleared after the item's deletion was logged`, async () => {
        await assertSucceeds(moderatorDelete(asMod(), kind, []));
        await assertSucceeds(deleteDoc(doc(asMod(), kind, 'item1', part, 'part1')));
      });
    }
  });
}

describe('item moderation edge cases', () => {
  test('a group edit must still be a valid group', async () => {
    await assertFails(moderatorEdit(asMod(), 'studyGroups', { name: 'x'.repeat(76) }));
  });

  test("moderators cannot change a group's members", async () => {
    await assertFails(moderatorEdit(asMod(), 'studyGroups', { memberIds: ['owner'] }));
  });

  test('a delete-content entry must be named after the item', async () => {
    const db = asMod();
    await assertFails(setDoc(...log(db, 'random', { action: 'delete-content', contentPath: 'studyGroups/item1' })));
    await assertSucceeds(setDoc(...log(db, 'delete-studyGroups-item1', { action: 'delete-content', contentPath: 'studyGroups/item1' })));
  });

  test('only the known item types can be logged', async () => {
    const db = asMod();
    await assertFails(setDoc(...log(db, 'e1', { action: 'edit-content', contentPath: 'users/alice' })));
    await assertFails(setDoc(...log(db, 'delete-mentorships-x', { action: 'delete-content', contentPath: 'mentorships/x' })));
  });

  test('moderators can list meetup tasks, to delete them with the meetup', async () => {
    const { getDocs, collection } = await import('firebase/firestore');
    await assertSucceeds(getDocs(collection(asMod(), 'meetups', 'item1', 'tasks')));
  });
});
