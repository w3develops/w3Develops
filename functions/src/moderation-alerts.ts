// Tells the moderation team when something needs a look: a new report, a
// post or reply hidden by an automatic check, or an appeal. Each moderator
// gets a notification in their bell (users/{uid}/feed). Alerts about the same
// thing share a key, so five reports on one post make one unread alert, not
// five.
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFeed, type Member } from './feed.js';

const SYSTEM: Member = { id: 'system', username: 'Moderation', photo: '' };

/** Every moderator's uid, from moderators/{uid} (written by setModerator) */
async function moderatorIds(): Promise<string[]> {
  const team = await getFirestore().collection('moderators').get();
  return team.docs.map(member => member.id);
}

export async function notifyModerators(eventId: string, { key, message, detail }: { key: string; message: string; detail?: string }) {
  try {
    const ids = await moderatorIds();
    await writeFeed(eventId, ids.map(id => ({
      recipientId: id,
      type: 'moderation' as const,
      actorId: 'system',
      actorName: 'Moderation',
      message,
      detail,
      link: '/moderation',
      notify: true,
      key: `moderation-${key}`,
    })), new Map([['system', SYSTEM]]));
  } catch (error) {
    // An alert failing must never stop the report or check that caused it
    logger.error('Could not alert moderators', { key, error: String(error) });
  }
}
