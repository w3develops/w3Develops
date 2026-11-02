
import { NextResponse } from 'next/server';
import { fetchRecentPosts } from '@/lib/news';
import { generateNewsBrief } from '@/lib/news-brief';

// Build the brief once a day, so Jev credits are spent once per day
// instead of on every page view
export const revalidate = 86400;

export async function GET() {
  const posts = await fetchRecentPosts();
  const brief = await generateNewsBrief(posts);
  return NextResponse.json(brief);
}
