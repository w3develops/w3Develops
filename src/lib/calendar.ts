import type { Group } from '@/lib/types';
import { DAYS_OF_WEEK, isValidTimeZone, todayIn } from '@/lib/timezones';

// "Add to Google Calendar" links for groups that meet on set days. Google's
// event template takes the times as the host's wall-clock times plus their
// time zone (ctz), so each member's calendar shows the meetings in their own
// zone, and a weekly rule (recur) repeats them.

const RRULE_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const DEFAULT_MEETING_HOURS = 1;
const MAX_MEETING_HOURS = 8;

/** How long each meeting lasts: the group's daily time commitment, within reason */
export function meetingHours(group: Pick<Group, 'commitment' | 'commitmentHours'>): number {
  const hours = Number((group.commitment ?? group.commitmentHours ?? '').match(/^(\d+(?:\.\d+)?)/)?.[1]);
  return hours > 0 ? Math.min(hours, MAX_MEETING_HOURS) : DEFAULT_MEETING_HOURS;
}

const pad = (n: number) => String(n).padStart(2, '0');
// A wall-clock time as Google wants it, from a Date holding that time in UTC fields
const stamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`;

/**
 * A Google Calendar link that adds the group's meetings as a weekly repeating
 * event, starting from the next meeting day; null if the group has no days,
 * start time or time zone set.
 */
export function googleCalendarUrl(
  group: Pick<Group, 'name' | 'description' | 'commitmentDays' | 'startTime' | 'timezone' | 'commitment' | 'commitmentHours'>,
  { title, pageUrl, today }: { title: string; pageUrl: string; today?: string },
): string | null {
  const dayIndexes = (group.commitmentDays ?? []).map(day => DAYS_OF_WEEK.indexOf(day)).filter(i => i >= 0);
  const time = group.startTime?.match(/^(\d{2}):(\d{2})$/);
  if (dayIndexes.length === 0 || !time || !isValidTimeZone(group.timezone)) return null;

  // The first meeting day on or after today, in the host's time zone
  const [y, m, d] = (today ?? todayIn(group.timezone)).split('-').map(Number);
  let start = new Date(Date.UTC(y, m - 1, d, Number(time[1]), Number(time[2])));
  while (!dayIndexes.includes(start.getUTCDay())) start = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + meetingHours(group) * 60 * 60 * 1000);

  const byDay = [...new Set(dayIndexes)].sort().map(i => RRULE_DAYS[i]).join(',');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${group.name} (${title})`,
    dates: `${stamp(start)}/${stamp(end)}`,
    ctz: group.timezone,
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`,
    details: `${group.description ? `${group.description}\n\n` : ''}Group page: ${pageUrl}`,
    location: pageUrl,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
