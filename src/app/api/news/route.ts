
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { rssFeeds } from '@/lib/rss-feeds';

// Set cache to 24 hours as requested ("once a day")
export const revalidate = 86400; 

interface Post {
  title: string;
  link: string;
  isoDate: string;
  source: string;
}

const parser = new Parser({
    timeout: 15000, // 15 seconds timeout for each feed
});

export async function GET() {
  // Look back 7 days to ensure we catch the latest social posts even if the group hasn't posted today
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let allPosts: Post[] = [];

  const feedPromises = rssFeeds.map(async (feedUrl) => {
    try {
      const feed = await parser.parseURL(feedUrl);
      if (feed.items) {
        const posts = feed.items
          .filter(item => {
            if (!item.isoDate) return false;
            const itemDate = new Date(item.isoDate);
            return itemDate > sevenDaysAgo && item.title && item.link;
          })
          .map(item => ({
            title: item.title!,
            link: item.link!,
            isoDate: item.isoDate!,
            // Extract a clean source name from the feed title or URL
            source: feed.title || new URL(feedUrl).hostname.replace(/^www\./, ''),
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

  return NextResponse.json(allPosts);
}
