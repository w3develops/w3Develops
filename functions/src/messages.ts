import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getMembers, writeFeed } from './feed.js';

/**
 * Tells the other member about a new direct message. One notification per
 * conversation, replaced by the latest, and without the message text, so
 * private messages don't sit in the activity feed.
 */
export const onDirectMessage = onDocumentCreated('conversations/{conversationId}/messages/{messageId}', async event => {
  const message = event.data?.data();
  const { conversationId } = event.params;
  if (typeof message?.senderId !== 'string') return;
  const recipientId = conversationId.split('_').find(id => id !== message.senderId);
  if (!recipientId) return;
  const members = await getMembers([message.senderId]);
  await writeFeed(event.id, [{
    recipientId, type: 'message', actorId: message.senderId, notify: true, category: 'messages',
    message: `${members.get(message.senderId)?.username ?? 'A member'} sent you a message`,
    link: `/messages?with=${message.senderId}`,
    key: `message-${conversationId}`,
  }], members);
});
