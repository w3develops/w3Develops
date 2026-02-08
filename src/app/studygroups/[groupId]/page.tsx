import GroupDashboardPage from './client';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { groupId: string } }) {
  return <GroupDashboardPage params={params} />;
}
