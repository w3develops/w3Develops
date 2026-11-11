import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { excerpt, getMembers, writeFeed } from './feed.js';
import { flagText, hideAfterCheck, inEmulator } from './post-checks.js';

/**
 * Runs when a reply to a feed post (memberPosts/{postId}/replies/{replyId})
 * is added or removed:
 * - keeps replyCount on the post up to date;
 * - tells the post's author about a new reply (unless they wrote it);
 * - checks a new reply's text like a post's, and hides it if it's flagged.
 */
export const onReplyWritten = onDocumentWritten('memberPosts/{postId}/replies/{replyId}', async event => {
  const { postId, replyId } = event.params;
  const before = event.data?.before.exists ? event.data.before.data() : undefined;
  const after = event.data?.after.exists ? event.data.after.data() : undefined;
  if (!!before === !!after) return; // a moderator hid or restored it

  const db = getFirestore();
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

  if (inEmulator || typeof after.text !== 'string') return;
  try {
    const flags = await flagText(after.text);
    if (flags.length > 0) await hideAfterCheck(event.data!.after.ref, { postId, replyId }, flags);
  } catch (error) {
    logger.error('Reply check failed', { postId, replyId, error: String(error) });
  }
});
