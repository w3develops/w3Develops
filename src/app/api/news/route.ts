import { NextResponse } from 'next/server';
import { loadNewsPosts } from '@/lib/news-editions';
import { cacheUntilNextEdition, RETRY_SOON } from '@/lib/news-schedule';

// The route runs on every request that reaches the server; the posts are
// cached per edition, so they refresh at 1am, 4am, 7am, 10am, 1pm, 4pm, 7pm
// and 10pm Pacific time.
export const dynamic = 'force-dynamic';

export async function GET() {
  const { edition, data, current } = await loadNewsPosts();
  return NextResponse.json(data, { headers: current ? cacheUntilNextEdition(edition) : RETRY_SOON });
}
