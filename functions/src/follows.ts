import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { added, getMembers, writeFeed, type FeedEntry } from './feed.js';

/**
 * When someone follows a member: the member is notified, and the follower's
 * own feed records it. Unfollows aren't announced.
 *
 * A private account adds its new followers itself, when it accepts their
 * follow requests (firestore.rules: match /followRequests). The follower
 * can't be added to the account's followers by anyone else, so a new
 * follower who doesn't list the account in their `following` yet was
 * accepted: this adds it there and tells them.
 */
export const onFollow = onDocumentUpdated('users/{userId}', async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  const newFollowers = added(before.followers, after.followers);
  if (newFollowers.length === 0) return;

  const userId = event.params.userId;
  const db = getFirestore();
  const followerDocs = await db.getAll(...newFollowers.map(id => db.collection('users').doc(id)));
  const accepted = new Set(
    followerDocs
      .filter(follower => follower.exists && !(follower.get('following') ?? []).includes(userId))
      .map(follower => follower.id),
  );
  await Promise.all([...accepted].map(id => db.collection('users').doc(id).update({ following: FieldValue.arrayUnion(userId) })));

  const members = await getMembers([userId, ...newFollowers]);
  const followed = members.get(userId);
  const entries: FeedEntry[] = newFollowers.flatMap((followerId): FeedEntry[] => accepted.has(followerId)
    ? [{
        recipientId: followerId, type: 'request_accepted', actorId: userId, notify: true, category: 'follows',
        message: `${followed?.username ?? 'A member'} accepted your follow request`,
        link: `/users/${userId}`,
      }]
    : [
        {
          recipientId: userId, type: 'follow', actorId: followerId, notify: true, category: 'follows',
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

/** Tells a private account that someone asked to follow it */
export const onFollowRequest = onDocumentCreated('followRequests/{requestId}', async event => {
  const request = event.data?.data();
  if (typeof request?.toId !== 'string' || typeof request?.fromId !== 'string') return;
  const members = await getMembers([request.fromId]);
  await writeFeed(event.id, [{
    recipientId: request.toId, type: 'follow_request', actorId: request.fromId, notify: true, category: 'follows',
    message: `${members.get(request.fromId)?.username ?? 'A member'} asked to follow you`,
    link: '/feed#follow-requests',
    key: `follow-request-${request.fromId}`,
  }], members);
});
