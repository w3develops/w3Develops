import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

/**
 * Open reports from different members that hide a post until a moderator
 * reviews it. Keep in step with AUTO_HIDE_REPORTS in src/lib/member-posts.ts.
 */
const AUTO_HIDE_REPORTS = 3;

/**
 * Logs each new member report (src/components/ReportUserButton.tsx) as a
 * structured entry, so a Cloud Monitoring alert can email the team. Only the
 * report's ID and reason are logged; the details stay in Firestore, where
 * moderators read them on /moderation (or the team in the Firebase console).
 *
 * A report about a post may also hide the post: see hideIfReported.
 */
export const onReport = onDocumentCreated('reports/{reportId}', async event => {
  const report = event.data?.data();
  const reason = report?.reason;
  logger.warn('New member report', {
    event: 'member_report',
    reportId: event.params.reportId,
    reason: typeof reason === 'string' ? reason : 'unknown',
    isPost: typeof report?.postId === 'string',
  });
  if (typeof report?.postId === 'string') {
    await hideIfReported(report.postId);
  }
});

/**
 * Hides a visible post once enough different members have open reports on
 * it, and logs that in moderationLog as the "system". Moderators then
 * restore or remove it on /moderation; restoring closes the reports, so the
 * post isn't hidden again by the same ones. Runs in a transaction, so
 * reports arriving together hide the post once.
 */
async function hideIfReported(postId: string) {
  const db = getFirestore();
  const postRef = db.collection('memberPosts').doc(postId);
  const openReports = db.collection('reports').where('postId', '==', postId).where('status', '==', 'open');

  const hidden = await db.runTransaction(async transaction => {
    const [post, reports] = await Promise.all([transaction.get(postRef), transaction.get(openReports)]);
    if (!post.exists || post.get('status') !== 'visible') return false;
    // Report IDs are "<postId>_<reporter>", so each member counts once
    const reporters = new Set(reports.docs.map(report => report.get('reporterId')));
    if (reporters.size < AUTO_HIDE_REPORTS) return false;

    const logRef = db.collection('moderationLog').doc();
    transaction.set(logRef, {
      actorId: 'system',
      action: 'auto-hide',
      targetUserId: post.get('authorId'),
      postId,
      note: `Hidden after ${reporters.size} open reports`,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.update(postRef, { status: 'hidden', hiddenBy: 'reports', moderationLogId: logRef.id });
    return true;
  });

  if (hidden) {
    logger.warn('Post hidden after reports', { event: 'post_auto_hidden', postId });
  }
}
