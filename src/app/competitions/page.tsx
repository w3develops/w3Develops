import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';
import { getPublicList, roundedNow } from '@/lib/public-items';
import CompetitionList from './CompetitionList';

// Rendered with the current competitions at most every five minutes
export const revalidate = 300;

export const metadata: Metadata = pageMetadata('/competitions');

export default async function CompetitionsPage() {
  const initial = await getPublicList({ collection: 'competitions', orderBy: 'endDate', direction: 'desc', limit: 100 });
  return <CompetitionList initial={initial} renderedAt={roundedNow()} />;
}
