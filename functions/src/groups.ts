import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { added, getFollowers, getMembers, writeFeed, type FeedEntry } from './feed.js';

// Study groups, group projects and book clubs, with the words and pages for each
export const GROUP_KINDS = {
  studyGroups: { path: '/studygroups', noun: 'study group' },
  groupProjects: { path: '/groupprojects', noun: 'group project' },
  bookClubs: { path: '/book-clubs', noun: 'book club' },
} as const;
export type GroupCollection = keyof typeof GROUP_KINDS;

export const isGroupCollection = (name: string): name is GroupCollection => name in GROUP_KINDS;

/**
 * When members join or leave a group: the other members are notified, and
 * the member's own feed records it. A member's followers also hear when they
 * join a group (but not when they leave).
 */
function onMembershipChange(collection: GroupCollection) {
  const kind = GROUP_KINDS[collection];
  return onDocumentUpdated(`${collection}/{groupId}`, async event => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    const joined = added(before.memberIds, after.memberIds);
    const left = added(after.memberIds, before.memberIds);
    if (joined.length === 0 && left.length === 0) return;

    const groupId = event.params.groupId;
    const groupName = typeof after.name === 'string' && after.name ? after.name : `a ${kind.noun}`;
    const link = `${kind.path}/${groupId}`;
    const current: string[] = Array.isArray(after.memberIds) ? after.memberIds : [];
    const members = await getMembers([...joined, ...left]);
    const name = (id: string) => members.get(id)?.username ?? 'A member';

    const entries: FeedEntry[] = [];
    for (const memberId of joined) {
      entries.push({ recipientId: memberId, type: 'group_join', actorId: memberId, notify: false, message: `You joined ${groupName}`, link });
      for (const otherId of current) {
        if (otherId === memberId || joined.includes(otherId)) continue;
        entries.push({ recipientId: otherId, type: 'group_join', actorId: memberId, notify: true, category: 'groupMembers', message: `${name(memberId)} joined ${groupName}`, link });
      }
      // Followers who aren't in the group already heard nothing above
      for (const followerId of await getFollowers(memberId)) {
        if (current.includes(followerId)) continue;
        entries.push({ recipientId: followerId, type: 'group_join', actorId: memberId, notify: true, category: 'following', message: `${name(memberId)} joined the ${kind.noun} ${groupName}`, link });
      }
    }
    for (const memberId of left) {
      entries.push({ recipientId: memberId, type: 'group_leave', actorId: memberId, notify: false, message: `You left ${groupName}`, link });
      for (const otherId of current) {
        entries.push({ recipientId: otherId, type: 'group_leave', actorId: memberId, notify: true, category: 'groupMembers', message: `${name(memberId)} left ${groupName}`, link });
      }
    }
    await writeFeed(event.id, entries, members);
  });
}

export const onStudyGroupMembers = onMembershipChange('studyGroups');
export const onGroupProjectMembers = onMembershipChange('groupProjects');
export const onBookClubMembers = onMembershipChange('bookClubs');
