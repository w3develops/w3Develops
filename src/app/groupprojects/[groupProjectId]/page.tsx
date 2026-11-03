import GroupDashboard from '@/components/groups/GroupDashboard';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { groupProjectId: string } }) {
  return <GroupDashboard kind="groupProject" groupId={params.groupProjectId} />;
}
