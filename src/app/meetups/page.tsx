import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';
import { getInitialMeetups } from '@/lib/list-pages';
import MeetupList from './MeetupList';

// Rendered with the current meetups at most every five minutes
export const revalidate = 300;

export const metadata: Metadata = pageMetadata('/meetups');

export default async function MeetupsPage() {
  return <MeetupList initial={await getInitialMeetups()} />;
}
