
import { NextResponse } from 'next/server';
import { fetchRecentPosts } from '@/lib/news';
import { generateNewsBrief } from '@/lib/news-brief';

// Build the brief once a day, so Jev credits are spent once per day
// instead of on every page view
export const revalidate = 86400;

export async function GET() {
  const posts = await fetchRecentPosts();
  const brief = await generateNewsBrief(posts);

  // Background refreshes on Cloud Run can time out every Jev call. Throwing
  // makes Next.js keep serving the last good brief and retry on the next
  // visit, instead of caching the keyword fallback for a whole day.
  // During a build there is no earlier brief, so the fallback is kept.
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  if (brief.rankedBy === 'keywords' && process.env.JEV_API_KEY && !isBuild) {
    throw new Error('Jev ranking failed, keeping the previous brief');
  }

  return NextResponse.json(brief);
}
