
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { rssFeeds } from '@/lib/rss-feeds';

// We will use time-based revalidation on the frontend page, but this ensures the API route itself has a cache policy.
export const revalidate = 43200; // Revalidate every 12 hours

interface Post {
  title: string;
  link: string;
  isoDate: string;
  source: string;
}

const parser = new Parser({
    timeout: 10000, // 10 seconds timeout for each feed
});

export async function GET() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  let allPosts: Post[] = [];

  const feedPromises = rssFeeds.map(async (feedUrl) => {
    try {
      const feed = await parser.parseURL(feedUrl);
      if (feed.items) {
        const posts = feed.items
          .filter(item => {
            if (!item.isoDate) return false;
            const itemDate = new Date(item.isoDate);
            return itemDate > threeDaysAgo && item.title && item.link;
          })
          .map(item => ({
            title: item.title!,
            link: item.link!,
            isoDate: item.isoDate!,
            source: feed.title || new URL(feedUrl).hostname.replace(/^www\./, ''),
          }));
        return posts;
      }
    } catch (error) {
      // Log the error but don't let a single failed feed stop the entire process
      console.warn(`Failed to fetch or parse RSS feed: ${feedUrl}`);
    }
    return []; // Return empty array on failure
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
