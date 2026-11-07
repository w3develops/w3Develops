import GroupForm from '@/components/groups/GroupForm';

export default async function Page({ params }: { params: Promise<{ groupId: string }> }) {
  const resolvedParams = await params;
  return <GroupForm kind="studyGroup" groupId={resolvedParams.groupId} />;
}
