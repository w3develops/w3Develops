// Time zone arithmetic for group schedules, matching src/lib/timezones.ts
// on the site: groups store their days ("Mon"), start time ("18:30") and
// time zone ("America/New_York") as the host sees them.

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function wallClock(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

/** How far `timeZone` is ahead of UTC at `ms`, in milliseconds */
function offsetMs(ms: number, timeZone: string): number {
  const w = wallClock(new Date(ms), timeZone);
  return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second) - Math.floor(ms / 1000) * 1000;
}

export function isValidTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== 'string' || !timeZone) return false;
  try { new Intl.DateTimeFormat('en-US', { timeZone }); return true; } catch { return false; }
}

/**
 * The meeting starts (as UTC milliseconds) of a weekly schedule on the
 * host's calendar days around `now`: yesterday, today and tomorrow there.
 */
export function meetingsAround(now: number, days: string[], startTime: string, timeZone: string): number[] {
  const time = startTime.match(/^(\d{2}):(\d{2})$/);
  if (!time) return [];
  const today = wallClock(new Date(now), timeZone);
  const starts: number[] = [];
  for (const shift of [-1, 0, 1]) {
    const date = new Date(Date.UTC(today.year, today.month - 1, today.day + shift));
    if (!days.includes(DAYS_OF_WEEK[date.getUTCDay()])) continue;
    const guess = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), Number(time[1]), Number(time[2]));
    // A second pass settles times near a daylight saving change
    const first = guess - offsetMs(guess, timeZone);
    starts.push(guess - offsetMs(first, timeZone));
  }
  return starts;
}
