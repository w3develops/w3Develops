import GroupForm from '@/components/groups/GroupForm';

export default function Page({ params }: { params: { groupId: string } }) {
  return <GroupForm kind="studyGroup" groupId={params.groupId} />;
}
