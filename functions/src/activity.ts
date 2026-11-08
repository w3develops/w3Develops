import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { excerpt, getMembers, writeFeed, type FeedEntry, type FeedType } from './feed.js';
import { GROUP_KINDS, isGroupCollection } from './groups.js';

// Check-ins and tasks inside study groups, group projects and book clubs.
// One function per event covers all three kinds of group: the first part of
// the path is the group's collection, checked against GROUP_KINDS, so
// check-ins and tasks elsewhere (like mentorships) are ignored.

interface GroupActivity {
  eventId: string;
  collection: string;
  groupId: string;
  actorId: unknown;
  type: FeedType;
  /** "posted a daily check-in in", "added a task in", ... */
  verb: string;
  detail: string;
}

/** The actor's own feed records it; every other member is notified */
async function shareWithGroup({ eventId, collection, groupId, actorId, type, verb, detail }: GroupActivity) {
  if (!isGroupCollection(collection) || typeof actorId !== 'string' || !actorId) return;
  const kind = GROUP_KINDS[collection];
  const group = (await getFirestore().collection(collection).doc(groupId).get()).data();
  if (!group) return;
  const groupName = typeof group.name === 'string' && group.name ? group.name : `a ${kind.noun}`;
  const memberIds: string[] = Array.isArray(group.memberIds) ? group.memberIds : [];
  const link = `${kind.path}/${groupId}`;
  const members = await getMembers([actorId]);
  const name = members.get(actorId)?.username ?? 'A member';

  const entries: FeedEntry[] = [
    { recipientId: actorId, type, actorId, notify: false, message: `You ${verb} ${groupName}`, detail, link },
    ...memberIds
      .filter(id => id !== actorId)
      .map(id => ({ recipientId: id, type, actorId, notify: true, message: `${name} ${verb} ${groupName}`, detail, link })),
  ];
  await writeFeed(eventId, entries, members);
}

export const onCheckIn = onDocumentCreated('{collection}/{groupId}/checkIns/{checkInId}', async event => {
  const checkIn = event.data?.data();
  if (!checkIn) return;
  await shareWithGroup({
    eventId: event.id, collection: event.params.collection, groupId: event.params.groupId,
    actorId: checkIn.userId, type: 'checkin',
    verb: `posted a ${checkIn.type === 'weekly' ? 'weekly' : 'daily'} check-in in`,
    detail: excerpt(checkIn.content),
  });
});

export const onTaskAdded = onDocumentCreated('{collection}/{groupId}/tasks/{taskId}', async event => {
  const task = event.data?.data();
  if (!task) return;
  await shareWithGroup({
    eventId: event.id, collection: event.params.collection, groupId: event.params.groupId,
    actorId: task.creatorId, type: 'task_added', verb: 'added a task in', detail: excerpt(task.description),
  });
});

/** Only finishing a task counts; reordering or unticking it doesn't */
export const onTaskDone = onDocumentUpdated('{collection}/{groupId}/tasks/{taskId}', async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after || before.isCompleted || !after.isCompleted) return;
  await shareWithGroup({
    eventId: event.id, collection: event.params.collection, groupId: event.params.groupId,
    actorId: after.completedBy, type: 'task_done', verb: 'finished a task in', detail: excerpt(after.description),
  });
});
