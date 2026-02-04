import CompetitionDashboardPage from './client';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { competitionId: string } }) {
  return <CompetitionDashboardPage params={params} />;
}