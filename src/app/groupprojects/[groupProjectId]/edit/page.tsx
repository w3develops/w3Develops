import GroupForm from '@/components/groups/GroupForm';

export default function Page({ params }: { params: { groupProjectId: string } }) {
  return <GroupForm kind="groupProject" groupId={params.groupProjectId} />;
}
