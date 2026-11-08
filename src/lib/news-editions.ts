// Server code only: the current news edition's headlines and briefing, for
// the news pages and their API routes. Editions change at 1am, 4am, 7am,
// 10am, 1pm, 4pm, 7pm and 10pm Pacific time (see news-schedule.ts).
import { unstable_cache } from 'next/cache';
import { getEditionPosts, type Post } from '@/lib/news';
import { generateNewsBrief, type NewsBrief } from '@/lib/news-brief';
import { currentNewsEdition, type NewsEdition } from '@/lib/news-schedule';

/** What was loaded, and whether it's this edition's (or an older copy shown while a refresh fails) */
export interface EditionResult<T> {
  edition: NewsEdition;
  data: T;
  current: boolean;
}

// Shown if a refresh can't read any feed
let lastPosts: Post[] | null = null;

/** This edition's headlines, or the last ones loaded if the feeds can't be read */
export async function loadNewsPosts(): Promise<EditionResult<Post[]>> {
  const edition = currentNewsEdition();
  try {
    const posts = await getEditionPosts(edition.id);
    lastPosts = posts;
    return { edition, data: posts, current: true };
  } catch (error) {
    console.warn('News feeds could not be read, showing the last posts loaded:', error);
    return { edition, data: lastPosts ?? [], current: false };
  }
}

class JevUnavailable extends Error {
  constructor(readonly keywordBrief: NewsBrief) {
    super('Jev could not rank any headlines');
  }
}

// Throws when Jev ranked nothing, so a keyword-sorted brief is never cached
// for a whole edition while Jev is set up; the next visit tries again.
// Built once per edition, so Jev credits are spent once per edition, not per view.
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

/** This edition's briefing, an older one while a refresh fails, or null if there's none at all */
export async function loadNewsBrief(): Promise<EditionResult<NewsBrief | null>> {
  const edition = currentNewsEdition();
  try {
    const brief = await getEditionBrief(edition.id);
    lastBrief = brief;
    return { edition, data: brief, current: true };
  } catch (error) {
    const fallback = lastBrief ?? (error instanceof JevUnavailable ? error.keywordBrief : null);
    console.warn('The news brief could not be refreshed:', error instanceof Error ? error.message : error);
    return { edition, data: fallback, current: false };
  }
}
