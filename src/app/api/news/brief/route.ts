import { NextResponse } from 'next/server';
import { loadNewsBrief } from '@/lib/news-editions';
import { cacheUntilNextEdition, RETRY_SOON } from '@/lib/news-schedule';

// The route runs on every request that reaches the server; the brief is
// built once per news edition (1am, 4am, 7am, 10am, 1pm, 4pm, 7pm and 10pm
// Pacific time).
export const dynamic = 'force-dynamic';

export async function GET() {
  const { edition, data, current } = await loadNewsBrief();
  if (!data) {
    return NextResponse.json({ error: 'The news brief is unavailable right now.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  return NextResponse.json(data, { headers: current ? cacheUntilNextEdition(edition) : RETRY_SOON });
}
