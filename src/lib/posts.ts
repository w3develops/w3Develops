// Server code only: reads of w3Develops' scheduled posts for the news page,
// the archive and each post's page. Posts are public (see firestore.rules).
import { getPublicItem, getPublicList } from '@/lib/public-items';
import type { PostTopic } from '@/lib/post-topics';
import { toPostView, toPostViews, type PostView } from '@/lib/post-view';

export const ARCHIVE_PAGE_SIZE = 30;

/** The newest posts, for the carousel on /news; empty if they can't be read */
export async function getLatestPosts(count = 5): Promise<PostView[]> {
  return toPostViews(await getPublicList({ collection: 'posts', orderBy: 'createdAt', direction: 'desc', limit: count }));
}

/**
 * One page of the archive, newest first: every post, or one topic's, from
 * before `before` (milliseconds). Null if they can't be read.
 */
export async function getArchivePage({ topic, before }: { topic?: PostTopic; before?: number }): Promise<{ posts: PostView[]; more: boolean } | null> {
  const list = await getPublicList({
    collection: 'posts',
    orderBy: 'createdAt',
    direction: 'desc',
    // One extra tells us whether there's another page
    limit: ARCHIVE_PAGE_SIZE + 1,
    ...(topic && { equals: { field: 'topic', value: topic } }),
    ...(before !== undefined && { after: { field: 'createdAt', op: '<' as const, millis: before } }),
  });
  if (!list) return null;
  const posts = toPostViews(list);
  return { posts: posts.slice(0, ARCHIVE_PAGE_SIZE), more: list.length > ARCHIVE_PAGE_SIZE };
}

/** The latest post on one topic, or null */
export async function getLatestPostOn(topic: PostTopic): Promise<PostView | null> {
  const list = await getPublicList({
    collection: 'posts', orderBy: 'createdAt', direction: 'desc', limit: 1, equals: { field: 'topic', value: topic },
  });
  return toPostViews(list)[0] ?? null;
}

export async function getPost(id: string): Promise<PostView | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return null;
  return toPostView(await getPublicItem('posts', id));
}
