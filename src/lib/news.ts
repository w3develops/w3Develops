import Parser from 'rss-parser';
import { unstable_cache } from 'next/cache';
import { featuredFeeds, rssFeeds } from '@/lib/rss-feeds';

export interface Post {
  title: string;
  link: string;
  isoDate: string;
  source: string;
  /** From a feed the news page pins to the top */
  featured?: boolean;
}

// Only recent posts are shown. Posts are never stored: each edition reads the
// feeds again, and the cached copy expires with the edition.
const MAX_POST_AGE_DAYS = 3;

const parser = new Parser({
    // The first visitor after each refresh time waits for the slowest feed.
    // Working feeds answer within about 2 seconds; this cuts off ones that hang.
    timeout: 6000,
});

/**
 * Fetches every RSS feed in rssFeeds and returns the last 3 days of posts,
 * newest first. Feeds that fail are skipped.
 */
export async function fetchRecentPosts(): Promise<Post[]> {
  const cutoff = Date.now() - MAX_POST_AGE_DAYS * 24 * 60 * 60 * 1000;

  let allPosts: Post[] = [];

  const feedPromises = rssFeeds.map(async (feedUrl) => {
    try {
      const feed = await parser.parseURL(feedUrl);
      if (feed.items) {
        const posts = feed.items
          .filter(item => {
            if (!item.isoDate) return false;
            return new Date(item.isoDate).getTime() > cutoff && item.title && item.link;
          })
          .map(item => ({
            title: item.title!,
            link: item.link!,
            isoDate: item.isoDate!,
            // Extract a clean source name from the feed title or URL
            source: feed.title?.trim() || new URL(feedUrl).hostname.replace(/^www\./, ''),
            ...(featuredFeeds.includes(feedUrl) && { featured: true }),
          }));
        return posts;
      }
    } catch (error) {
      console.warn(`Failed to fetch or parse RSS feed: ${feedUrl}`);
    }
    return [];
  });

  const results = await Promise.allSettled(feedPromises);

  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value) {
      allPosts = allPosts.concat(result.value);
    }
  });

  // Sort all collected posts by date, newest first
  allPosts.sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime());

  return allPosts;
}

// Editions last three hours (four on the night clocks go back), so an entry
// is never this old while its edition is still showing
const EDITION_CACHE_SECONDS = 6 * 60 * 60;

/**
 * The posts for one news edition (see news-schedule.ts). Every feed is read
 * once per edition, and the feed and the brief share the result. Throws when
 * no feed could be read, so an empty list is never cached.
 */
export const getEditionPosts = unstable_cache(
  async (editionId: string): Promise<Post[]> => {
    const posts = await fetchRecentPosts();
    if (posts.length === 0) {
      throw new Error(`None of the news feeds could be read for the ${editionId} edition`);
    }
    return posts;
  },
  ['news-edition-posts'],
  { revalidate: EDITION_CACHE_SECONDS },
);
