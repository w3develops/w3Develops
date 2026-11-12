import type { Metadata } from 'next';
import CompetitionDashboardPage from './client';
import { notFound } from 'next/navigation';
import { getPublicItem, getPublicItemOrMissing, itemMetadata } from '@/lib/public-items';

type Props = { params: Promise<{ competitionId: string }> };

// Rendered on the server with the competition's details, then kept live in the browser
export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { competitionId } = await params;
  const item = await getPublicItem('competitions', competitionId);
  return itemMetadata(item, {
    path: `/competitions/${competitionId}`,
    name: item?.name as string | undefined,
    fallbackDescription: 'A w3Develops community coding competition.',
    kindLabel: 'Competition',
  });
}

export default async function Page({ params }: Props) {
  const { competitionId } = await params;
  const { item, missing } = await getPublicItemOrMissing('competitions', competitionId);
  // A real 404 for ones that don't exist, so search engines drop them
  if (missing) notFound();
  return <CompetitionDashboardPage params={{ competitionId }} initialCompetition={item ?? undefined} />;
}
