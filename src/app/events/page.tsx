import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';
import { getPublicList, roundedNow } from '@/lib/public-items';
import EventsCalendar from './EventsCalendar';

// Rendered with the upcoming events at most every five minutes
export const revalidate = 300;

export const metadata: Metadata = pageMetadata('/events');

// Meetups stay listed for a few hours after they start, while they may be on
const STARTED_GRACE_MS = 4 * 60 * 60 * 1000;

export default async function EventsPage() {
  const now = roundedNow();
  const [meetups, competitions] = await Promise.all([
    getPublicList({ collection: 'meetups', orderBy: 'dateTime', direction: 'asc', limit: 100, after: { field: 'dateTime', op: '>=', millis: now - STARTED_GRACE_MS } }),
    getPublicList({ collection: 'competitions', orderBy: 'endDate', direction: 'asc', limit: 50, after: { field: 'endDate', op: '>=', millis: now } }),
  ]);
  return <EventsCalendar initialMeetups={meetups} initialCompetitions={competitions} />;
}
