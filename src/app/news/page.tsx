import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';
import { loadNewsPosts } from '@/lib/news-editions';
import { getPublicList } from '@/lib/public-items';
import { getLatestPostOn, getLatestPosts } from '@/lib/posts';
import NewsFeed from './NewsFeed';
import type { ArticleSummary } from '@/components/articles/CommunityArticles';

// Rendered on each visit; the headlines are cached per news edition
export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMetadata('/news');

export default async function NewsPage() {
  const [posts, announcements, latestPosts, communityPost, articles] = await Promise.all([
    loadNewsPosts(),
    getPublicList({ collection: 'announcements', orderBy: 'createdAt', direction: 'desc', limit: 5 }),
    getLatestPosts(5),
    getLatestPostOn('community'),
    // Only published ones: server reads skip the rules that keep drafts private
    getPublicList({ collection: 'articles', equals: { field: 'status', value: 'published' }, orderBy: 'publishedAt', direction: 'desc', limit: 6 }),
  ]);
  // Just what the cards show, not the whole article body
  const communityArticles = ((articles ?? []) as Record<string, unknown>[]).map(article => ({
    id: String(article.id), title: String(article.title), summary: String(article.summary),
    topic: article.topic as ArticleSummary['topic'], authorName: String(article.authorName),
  }));
  return (
    <NewsFeed
      newsItems={posts.data}
      initialAnnouncements={announcements}
      latestPosts={latestPosts}
      communityPost={communityPost}
      communityArticles={communityArticles}
    />
  );
}
