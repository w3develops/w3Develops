
import MentorshipDashboardPage from './client';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { mentorshipId: string } }) {
  return <MentorshipDashboardPage params={params} />;
}
