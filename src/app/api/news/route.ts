import { NextResponse } from 'next/server';
import { getEditionPosts, type Post } from '@/lib/news';
import { cacheUntilNextEdition, currentNewsEdition, RETRY_SOON } from '@/lib/news-schedule';

// The route runs on every request that reaches the server; the posts are
// cached per edition, so they refresh at 1am, 4am, 7am, 10am, 1pm, 4pm, 7pm
// and 10pm Pacific time.
export const dynamic = 'force-dynamic';

// Shown if a refresh can't read any feed
let lastPosts: Post[] | null = null;

export async function GET() {
  const edition = currentNewsEdition();
  try {
    const posts = await getEditionPosts(edition.id);
    lastPosts = posts;
    return NextResponse.json(posts, { headers: cacheUntilNextEdition(edition) });
  } catch (error) {
    console.warn('News feeds could not be read, showing the last posts loaded:', error);
    return NextResponse.json(lastPosts ?? [], { headers: RETRY_SOON });
  }
}
