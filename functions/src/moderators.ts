import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

/**
 * Lets an admin (the `admin` custom claim) make a member a moderator, or stop
 * them being one, by username, from the Team tab on /moderation. Only server
 * code can change custom claims, which is why this is a function.
 *
 * It sets the `moderator` claim (keeping the account's other claims), keeps
 * moderators/{uid} up to date so moderators can see who's on the team, and
 * logs the change in moderationLog. The member sees the change once their
 * sign-in refreshes (within an hour, or straight away if they sign out and in).
 */
export const setModerator = onCall(async request => {
  const caller = request.auth;
  if (caller?.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Only admins can change who is a moderator.');
  }
  const { username, moderator } = (request.data ?? {}) as { username?: unknown; moderator?: unknown };
  if (typeof username !== 'string' || !/^[A-Za-z0-9]{3,24}$/.test(username) || typeof moderator !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Send a username and whether they should be a moderator.');
  }

  const db = getFirestore();
  const claimed = await db.doc(`usernames/${username.toLowerCase()}`).get();
  const uid = claimed.get('uid');
  if (typeof uid !== 'string') {
    throw new HttpsError('not-found', `No member is called ${username}.`);
  }
  if (uid === caller.uid && !moderator) {
    throw new HttpsError('failed-precondition', "You can't remove yourself. Ask another admin.");
  }

  const auth = getAuth();
  const user = await auth.getUser(uid);
  const claims = { ...(user.customClaims ?? {}) };
  if (moderator) claims.moderator = true;
  else delete claims.moderator;
  await auth.setCustomUserClaims(uid, claims);

  const profile = await db.doc(`users/${uid}`).get();
  const name = typeof profile.get('username') === 'string' ? profile.get('username') : username;
  const batch = db.batch();
  const moderatorRef = db.doc(`moderators/${uid}`);
  if (moderator) batch.set(moderatorRef, { username: name, addedBy: caller.uid, addedAt: FieldValue.serverTimestamp() });
  else batch.delete(moderatorRef);
  batch.set(db.collection('moderationLog').doc(), {
    actorId: caller.uid,
    action: moderator ? 'add-moderator' : 'remove-moderator',
    targetUserId: uid,
    note: '',
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  logger.info('Moderator changed', { event: 'moderator_changed', uid, moderator, by: caller.uid });
  return { uid, username: name };
});
