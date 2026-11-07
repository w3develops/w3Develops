import CompetitionDashboardPage from './client';

export async function generateStaticParams() {
  return [];
}

export default async function Page({ params }: { params: Promise<{ competitionId: string }> }) {
  const resolvedParams = await params;
  return <CompetitionDashboardPage params={resolvedParams} />;
}