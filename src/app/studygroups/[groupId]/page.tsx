import GroupDashboard from '@/components/groups/GroupDashboard';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { groupId: string } }) {
  return <GroupDashboard kind="studyGroup" groupId={params.groupId} />;
}
