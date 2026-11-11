import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { excerpt } from './feed.js';
import { notifyModerators } from './moderation-alerts.js';

/**
 * Open reports from different members that hide a post or reply until a
 * moderator reviews it. Keep in step with AUTO_HIDE_REPORTS in
 * src/lib/member-posts.ts.
 */
const AUTO_HIDE_REPORTS = 3;

/** The reporter of reports filed by the automatic checks (functions/src/post-checks.ts) */
export const AUTO_CHECK_REPORTER = 'auto-check';

/**
 * Logs each new report (src/components/ReportUserButton.tsx, or the
 * automatic checks) as a structured entry and alerts the moderators. Only
 * the report's ID and reason are logged; the details stay in Firestore,
 * where moderators read them on /moderation.
 *
 * A report about a post or reply may also hide it: see hideIfReported.
 */
export const onReport = onDocumentCreated('reports/{reportId}', async event => {
  const report = event.data?.data();
  const reason = report?.reason;
  const postId = typeof report?.postId === 'string' ? report.postId : null;
  const replyId = typeof report?.replyId === 'string' ? report.replyId : null;
  logger.warn('New member report', {
    event: 'member_report',
    reportId: event.params.reportId,
    reason: typeof reason === 'string' ? reason : 'unknown',
    isPost: !!postId,
    isReply: !!replyId,
  });

  const isAutoCheck = report?.reporterId === AUTO_CHECK_REPORTER;
  const what = replyId ? 'reply' : postId ? 'post' : 'member';
  await notifyModerators(event.id, {
    key: replyId ? `reply-${replyId}` : postId ? `post-${postId}` : `member-${report?.reportedUserId}`,
    message: isAutoCheck ? `The automatic check hid a ${what}` : `A ${what} was reported`,
    detail: excerpt(report?.details),
  });

  if (postId && !isAutoCheck) await hideIfReported(postId, replyId);
});

/**
 * Hides a visible post (or a reply, with replyId) once enough different
 * members have open reports on it, and logs that in moderationLog as the
 * "system". Moderators then restore or remove it on /moderation; restoring
 * closes the reports, so it isn't hidden again by the same ones. Runs in a
 * transaction, so reports arriving together hide it once.
 */
async function hideIfReported(postId: string, replyId: string | null) {
  const db = getFirestore();
  const postRef = db.collection('memberPosts').doc(postId);
  const targetRef = replyId ? postRef.collection('replies').doc(replyId) : postRef;
  const openReports = db.collection('reports').where('postId', '==', postId).where('status', '==', 'open');

  const hidden = await db.runTransaction(async transaction => {
    const [target, reports] = await Promise.all([transaction.get(targetRef), transaction.get(openReports)]);
    if (!target.exists || target.get('status') !== 'visible') return false;
    // Report IDs end in the reporter's uid, so each member counts once. A
    // post's own reports don't have a replyId; a reply's do.
    const reporters = new Set(reports.docs
      .filter(report => (report.get('replyId') ?? null) === replyId)
      .map(report => report.get('reporterId')));
    if (reporters.size < AUTO_HIDE_REPORTS) return false;

    const logRef = db.collection('moderationLog').doc();
    transaction.set(logRef, {
      actorId: 'system',
      action: 'auto-hide',
      targetUserId: target.get('authorId'),
      postId,
      ...(replyId && { replyId }),
      note: `Hidden after ${reporters.size} open reports`,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.update(targetRef, { status: 'hidden', hiddenBy: 'reports', moderationLogId: logRef.id });
    return true;
  });

  if (hidden) {
    logger.warn('Hidden after reports', { event: 'post_auto_hidden', postId, replyId });
  }
}
