
import TutorshipDashboardPage from './client';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { tutorshipId: string } }) {
  return <TutorshipDashboardPage params={params} />;
}

    