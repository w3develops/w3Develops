
import GroupProjectDashboardPage from './client';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { groupProjectId: string } }) {
  return <GroupProjectDashboardPage params={params} />;
}
