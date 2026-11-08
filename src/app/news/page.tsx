import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';
import { loadNewsPosts } from '@/lib/news-editions';
import { getPublicList } from '@/lib/public-items';
import NewsFeed from './NewsFeed';

// Rendered on each visit; the headlines are cached per news edition
export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMetadata('/news');

export default async function NewsPage() {
  const [posts, announcements] = await Promise.all([
    loadNewsPosts(),
    getPublicList({ collection: 'announcements', orderBy: 'createdAt', direction: 'desc', limit: 5 }),
  ]);
  return <NewsFeed newsItems={posts.data} initialAnnouncements={announcements} />;
}
