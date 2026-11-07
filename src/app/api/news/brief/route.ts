import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getEditionPosts } from '@/lib/news';
import { generateNewsBrief, type NewsBrief } from '@/lib/news-brief';
import { cacheUntilNextEdition, currentNewsEdition, RETRY_SOON } from '@/lib/news-schedule';

// The route runs on every request that reaches the server; the brief is
// built once per news edition (1am, 4am, 7am, 10am, 1pm, 4pm, 7pm and 10pm
// Pacific time), so Jev credits are spent once per edition, not per view.
export const dynamic = 'force-dynamic';

class JevUnavailable extends Error {
  constructor(readonly keywordBrief: NewsBrief) {
    super('Jev could not rank any headlines');
  }
}

// Throws when Jev ranked nothing, so a keyword-sorted brief is never cached
// for a whole edition while Jev is set up; the next visit tries again.
const getEditionBrief = unstable_cache(
  async (editionId: string): Promise<NewsBrief> => {
    const brief = await generateNewsBrief(await getEditionPosts(editionId));
    if (brief.rankedBy === 'keywords' && process.env.JEV_API_KEY) {
      throw new JevUnavailable(brief);
    }
    return brief;
  },
  ['news-edition-brief'],
  { revalidate: 6 * 60 * 60 },
);

// Shown while Jev or the feeds are failing
let lastBrief: NewsBrief | null = null;

export async function GET() {
  const edition = currentNewsEdition();
  try {
    const brief = await getEditionBrief(edition.id);
    lastBrief = brief;
    return NextResponse.json(brief, { headers: cacheUntilNextEdition(edition) });
  } catch (error) {
    const fallback = lastBrief ?? (error instanceof JevUnavailable ? error.keywordBrief : null);
    console.warn('The news brief could not be refreshed:', error instanceof Error ? error.message : error);
    if (!fallback) {
      return NextResponse.json({ error: 'The news brief is unavailable right now.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json(fallback, { headers: RETRY_SOON });
  }
}
