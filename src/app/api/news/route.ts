
import { NextResponse } from 'next/server';
import { fetchRecentPosts } from '@/lib/news';

// Set cache to 24 hours as requested ("once a day")
export const revalidate = 86400;

export async function GET() {
  const allPosts = await fetchRecentPosts();
  return NextResponse.json(allPosts);
}
