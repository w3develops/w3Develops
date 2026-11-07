
import MeetupDashboardPage from './client';

export async function generateStaticParams() {
  return [];
}

export default async function Page({ params }: { params: Promise<{ meetupId: string }> }) {
  const resolvedParams = await params;
  return <MeetupDashboardPage params={resolvedParams} />;
}
