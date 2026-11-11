import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { excerpt, getMembers, writeFeed } from './feed.js';
import { notifyModerators } from './moderation-alerts.js';

/**
 * Member writing for /news (src/app/news/write): moderators hear about new
 * writer applications and submitted articles; members hear the decisions.
 */
export const onWriterApplication = onDocumentWritten('writerApplications/{userId}', async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!after) return;
  const { userId } = event.params;
  if (after.status === 'pending' && before?.status !== 'pending') {
    await notifyModerators(event.id, { key: `writer-${userId}`, message: 'A member applied to write articles', detail: excerpt(after.about) });
  } else if (before?.status === 'pending' && (after.status === 'approved' || after.status === 'rejected')) {
    await writeFeed(event.id, [{
      recipientId: userId, type: 'appeal', actorId: 'system', actorName: 'Moderation', notify: true,
      message: after.status === 'approved' ? 'You can now write articles for w3Develops' : 'Your application to write was not approved this time',
      detail: excerpt(after.note), link: '/news/write',
    }], await getMembers([]));
  }
});

export const onArticleWritten = onDocumentWritten('articles/{articleId}', async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!after || before?.status === after.status) return;
  const { articleId } = event.params;
  if (after.status === 'submitted') {
    await notifyModerators(event.id, { key: `article-${articleId}`, message: 'An article was submitted for review', detail: excerpt(after.title) });
  } else if ((after.status === 'published' || after.status === 'rejected') && typeof after.authorId === 'string') {
    await writeFeed(event.id, [{
      recipientId: after.authorId, type: 'appeal', actorId: 'system', actorName: 'Moderation', notify: true,
      message: after.status === 'published' ? `Your article “${excerpt(after.title, 80)}” is published` : `Your article “${excerpt(after.title, 80)}” was sent back`,
      detail: excerpt(after.editorNote), link: after.status === 'published' ? `/news/articles/${articleId}` : '/news/write',
    }], await getMembers([]));
  }
});
