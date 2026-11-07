import GroupForm from '@/components/groups/GroupForm';

export default async function Page({ params }: { params: Promise<{ groupProjectId: string }> }) {
  const resolvedParams = await params;
  return <GroupForm kind="groupProject" groupId={resolvedParams.groupProjectId} />;
}
