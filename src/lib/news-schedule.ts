import { zonedTimeToDate } from '@/lib/timezones';

// The news feed and the AI brief refresh at these hours, Pacific time
// (PST in winter, PDT in summer). Each stretch between two of them is one
// "edition": everyone sees the same news until the next one starts.
export const NEWS_TIME_ZONE = 'America/Los_Angeles';
const REFRESH_HOURS = [1, 4, 7, 10, 13, 16, 19, 22];

export interface NewsEdition {
  /** Stays the same for the whole edition, so caches can be keyed by it */
  id: string;
  startsAt: Date;
  endsAt: Date;
}

const pacificDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: NEWS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// Working out an edition takes a few milliseconds of timezone maths, so the
// server keeps the current one until it ends
let latest: NewsEdition | null = null;

/** The edition being shown at `now` */
export function currentNewsEdition(now = new Date()): NewsEdition {
  if (latest && latest.startsAt <= now && now < latest.endsAt) return latest;
  latest = findEdition(now);
  return latest;
}

function findEdition(now: Date): NewsEdition {
  const today = pacificDate.format(now); // "YYYY-MM-DD"
  // Every refresh time from yesterday to tomorrow, so the ones either side
  // of `now` are always in the list, even just after midnight
  const times = [-1, 0, 1]
    .flatMap(days => REFRESH_HOURS.map(hour =>
      zonedTimeToDate(addDays(today, days), `${String(hour).padStart(2, '0')}:00`, NEWS_TIME_ZONE)))
    .sort((a, b) => a.getTime() - b.getTime());

  const nextIndex = times.findIndex(time => time.getTime() > now.getTime());
  const startsAt = times[nextIndex - 1];
  const endsAt = times[nextIndex];
  return { id: startsAt.toISOString(), startsAt, endsAt };
}

/**
 * Lets Google's CDN share a response until the next edition starts, and no
 * longer, so nobody is shown the old news after a refresh time.
 */
export function cacheUntilNextEdition(edition: NewsEdition, now = new Date()): HeadersInit {
  const seconds = Math.max(1, Math.floor((edition.endsAt.getTime() - now.getTime()) / 1000));
  return { 'Cache-Control': `public, s-maxage=${seconds}` };
}

/** For a fallback response: try again in a few minutes */
export const RETRY_SOON: HeadersInit = { 'Cache-Control': 'public, s-maxage=300' };
