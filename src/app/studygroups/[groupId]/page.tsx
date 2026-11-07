import GroupDashboard from '@/components/groups/GroupDashboard';

export async function generateStaticParams() {
  return [];
}

export default async function Page({ params }: { params: Promise<{ groupId: string }> }) {
  const resolvedParams = await params;
  return <GroupDashboard kind="studyGroup" groupId={resolvedParams.groupId} />;
}
