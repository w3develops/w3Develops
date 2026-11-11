import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { excerpt, getMembers, writeFeed } from './feed.js';
import { notifyModerators } from './moderation-alerts.js';

/**
 * A member's appeal (appeals/{logId}): a new one alerts the moderators, and
 * an answered one tells the member.
 */
export const onAppealWritten = onDocumentWritten('appeals/{logId}', async event => {
  const before = event.data?.before.exists ? event.data.before.data() : undefined;
  const after = event.data?.after.exists ? event.data.after.data() : undefined;
  if (!after) return;

  if (!before) {
    await notifyModerators(event.id, {
      key: `appeal-${event.params.logId}`,
      message: 'A member appealed a moderation decision',
      detail: excerpt(after.text),
    });
    return;
  }

  if (before.status === 'open' && after.status !== 'open' && typeof after.userId === 'string') {
    const members = await getMembers([]);
    await writeFeed(event.id, [{
      recipientId: after.userId,
      type: 'appeal',
      actorId: 'system',
      actorName: 'Moderation',
      notify: true,
      message: after.status === 'reversed'
        ? 'A moderator reviewed your appeal and reversed the decision'
        : 'A moderator reviewed your appeal and kept the decision',
      detail: excerpt(after.response),
      link: after.postId ? `/feed/${after.postId}` : '/feed',
    }], members);
  }
});
