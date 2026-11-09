import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';

/**
 * Logs each new member report (src/components/ReportUserButton.tsx) as a
 * structured entry, so a Cloud Monitoring alert can email the team. Only the
 * report's ID and reason are logged; the details stay in Firestore, where the
 * team reads them in the Firebase console (reports collection).
 */
export const onReport = onDocumentCreated('reports/{reportId}', event => {
  const reason = event.data?.data()?.reason;
  logger.warn('New member report', {
    event: 'member_report',
    reportId: event.params.reportId,
    reason: typeof reason === 'string' ? reason : 'unknown',
  });
});
