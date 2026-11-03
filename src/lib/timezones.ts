// Real timezones (like "America/New_York") instead of fixed UTC offsets, so
// daylight saving time and half-hour zones (like India's +5:30) come out right.

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function allTimeZones(): string[] {
  try {
    return (Intl as any).supportedValuesOf('timeZone') as string[];
  } catch {
    return [browserTimeZone(), 'UTC'];
  }
}

export function isValidTimeZone(timeZone: string | undefined | null): timeZone is string {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** "America/New_York" becomes "New York (EST)" */
export function timeZoneLabel(timeZone: string): string {
  const city = timeZone.split('/').pop()?.replace(/_/g, ' ') || timeZone;
  try {
    const short = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
      .formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value;
    return short ? `${city} (${short})` : city;
  } catch {
    return city;
  }
}

function wallClock(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', weekday: 'short',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '0';
  return {
    year: Number(get('year')), month: Number(get('month')), day: Number(get('day')),
    hour: Number(get('hour')), minute: Number(get('minute')), second: Number(get('second')),
    weekday: get('weekday'),
  };
}

function offsetMs(instant: number, timeZone: string): number {
  const w = wallClock(new Date(instant), timeZone);
  return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second) - instant;
}

/** The moment when clocks in `timeZone` show `date` ("2026-11-03") at `time` ("18:30") */
export function zonedTimeToDate(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  // A second pass settles times near a daylight saving change
  const first = guess - offsetMs(guess, timeZone);
  return new Date(guess - offsetMs(first, timeZone));
}

/** Today's date in `timeZone`, as "YYYY-MM-DD" */
export function todayIn(timeZone: string): string {
  const w = wallClock(new Date(), timeZone);
  return `${w.year}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}`;
}

export function formatDateTime(date: Date, timeZone = browserTimeZone(), withZone = true): string {
  return date.toLocaleString('en-US', {
    timeZone, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    ...(withZone ? { timeZoneName: 'short' } : {}),
  });
}

/**
 * A weekly schedule set in the host's timezone, as the viewer sees it.
 * A Monday 8pm group in New York shows as "Tue at 9:00 AM" in Tokyo.
 */
export function describeSchedule(days: string[], startTime: string, hostTimeZone: string, viewerTimeZone = browserTimeZone()): string {
  if (!startTime || !isValidTimeZone(hostTimeZone)) return days.join(', ');
  const today = wallClock(new Date(), hostTimeZone);
  const todayIndex = DAYS_OF_WEEK.indexOf(today.weekday);
  const moments = days
    .filter(day => DAYS_OF_WEEK.includes(day))
    .map(day => {
      const ahead = (DAYS_OF_WEEK.indexOf(day) - todayIndex + 7) % 7;
      const date = new Date(Date.UTC(today.year, today.month - 1, today.day + ahead));
      return zonedTimeToDate(date.toISOString().slice(0, 10), startTime, hostTimeZone);
    });
  const time = (moments[0] ?? zonedTimeToDate(todayIn(hostTimeZone), startTime, hostTimeZone))
    .toLocaleTimeString('en-US', { timeZone: viewerTimeZone, hour: 'numeric', minute: '2-digit' });
  const viewerDays = Array.from(new Set(moments.map(m => m.toLocaleDateString('en-US', { timeZone: viewerTimeZone, weekday: 'short' }))))
    .sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b));
  return viewerDays.length ? `${viewerDays.join(', ')} at ${time}` : time;
}
