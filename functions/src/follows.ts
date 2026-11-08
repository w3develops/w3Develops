import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { added, getMembers, writeFeed, type FeedEntry } from './feed.js';

/**
 * When someone follows a member: the member is notified, and the follower's
 * own feed records it. Unfollows aren't announced.
 */
export const onFollow = onDocumentUpdated('users/{userId}', async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  const newFollowers = added(before.followers, after.followers);
  if (newFollowers.length === 0) return;

  const userId = event.params.userId;
  const members = await getMembers([userId, ...newFollowers]);
  const followed = members.get(userId);
  const entries: FeedEntry[] = newFollowers.flatMap(followerId => [
    {
      recipientId: userId, type: 'follow', actorId: followerId, notify: true,
      message: `${members.get(followerId)?.username ?? 'A member'} followed you`,
      link: `/users/${followerId}`,
    },
    {
      recipientId: followerId, type: 'follow', actorId: followerId, notify: false,
      message: `You followed ${followed?.username ?? 'a member'}`,
      link: `/users/${userId}`,
    },
  ]);
  await writeFeed(event.id, entries, members);
});
