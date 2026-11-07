import type { Metadata } from 'next';
import MeetupDashboardPage from './client';
import { getPublicItem, itemMetadata } from '@/lib/public-items';

type Props = { params: Promise<{ meetupId: string }> };

// Rendered on the server with the meetup's details, then kept live in the browser
export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { meetupId } = await params;
  const item = await getPublicItem('meetups', meetupId);
  return itemMetadata(item, {
    path: `/meetups/${meetupId}`,
    name: item?.name as string | undefined,
    fallbackDescription: 'A developer meetup hosted by the w3Develops community.',
    kindLabel: 'Meetup',
  });
}

export default async function Page({ params }: Props) {
  const { meetupId } = await params;
  const item = await getPublicItem('meetups', meetupId);
  return <MeetupDashboardPage params={{ meetupId }} initialMeetup={item ?? undefined} />;
}
