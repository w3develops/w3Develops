
import MeetupDashboardPage from './client';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { meetupId: string } }) {
  return <MeetupDashboardPage params={params} />;
}
