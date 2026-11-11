import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { FieldValue, getFirestore, type DocumentData, type DocumentReference } from 'firebase-admin/firestore';
import { excerpt, getMembers, writeFeed } from './feed.js';
import { flagText, hideAfterCheck, inEmulator } from './post-checks.js';
import { notifyMentions } from './mentions.js';

/**
 * Runs when a reply to a feed post (memberPosts/{postId}/replies/{replyId})
 * is added or removed:
 * - keeps replyCount on the post up to date;
 * - tells the post's author about a new reply (unless they wrote it);
 * - checks a new or edited reply's text like a post's, and hides it if
 *   it's flagged;
 * - tells members it @mentions.
 */
export const onReplyWritten = onDocumentWritten('memberPosts/{postId}/replies/{replyId}', async event => {
  const { postId, replyId } = event.params;
  const before = event.data?.before.exists ? event.data.before.data() : undefined;
  const after = event.data?.after.exists ? event.data.after.data() : undefined;
  const db = getFirestore();
  if (before && after) {
    // The author edited it: check the new text. (A moderator hiding or
    // restoring it changes nothing else.)
    if (after.text !== before.text && after.status === 'visible') {
      await checkReply(event.data!.after.ref, postId, replyId, after.text);
      await notifyReplyMentions(event.id, event.data!.after.ref, postId, replyId, before);
    }
    return;
  }

  const postRef = db.doc(`memberPosts/${postId}`);
  // The post may be gone already, when its replies are deleted with it
  await postRef.update({ replyCount: FieldValue.increment(after ? 1 : -1) }).catch(() => {});
  if (!after) return;

  const post = (await postRef.get()).data();
  if (post && post.authorId !== after.authorId) {
    const members = await getMembers([after.authorId]);
    await writeFeed(event.id, [{
      recipientId: post.authorId,
      type: 'reply',
      actorId: after.authorId,
      notify: true,
      category: 'replies',
      message: `${members.get(after.authorId)?.username ?? 'A member'} replied to your post`,
      detail: excerpt(after.text),
      link: `/feed/${postId}`,
    }], members);
  }

  await checkReply(event.data!.after.ref, postId, replyId, after.text);
  await notifyReplyMentions(event.id, event.data!.after.ref, postId, replyId, undefined);
});

/** Notifies members mentioned in a reply, once its check is done and if it's still visible */
async function notifyReplyMentions(eventId: string, ref: DocumentReference, postId: string, replyId: string, before: DocumentData | undefined) {
  const [reply, post] = await Promise.all([ref.get(), getFirestore().doc(`memberPosts/${postId}`).get()]);
  if (!reply.exists || !post.exists) return;
  await notifyMentions(eventId, { postId, replyId, after: reply.data()!, before, post: post.data()! });
}

/** Hides a reply whose text the automatic check flags; never throws */
async function checkReply(ref: DocumentReference, postId: string, replyId: string, text: unknown) {
  if (inEmulator || typeof text !== 'string') return;
  try {
    const flags = await flagText(text);
    if (flags.length > 0) await hideAfterCheck(ref, { postId, replyId }, flags);
  } catch (error) {
    logger.error('Reply check failed', { postId, replyId, error: String(error) });
  }
}
