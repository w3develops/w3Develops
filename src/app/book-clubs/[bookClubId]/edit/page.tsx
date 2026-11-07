import GroupForm from '@/components/groups/GroupForm';

export default async function Page({ params }: { params: Promise<{ bookClubId: string }> }) {
  const resolvedParams = await params;
  return <GroupForm kind="bookClub" groupId={resolvedParams.bookClubId} />;
}
