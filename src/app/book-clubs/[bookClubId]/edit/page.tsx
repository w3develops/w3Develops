import GroupForm from '@/components/groups/GroupForm';

export default function Page({ params }: { params: { bookClubId: string } }) {
  return <GroupForm kind="bookClub" groupId={params.bookClubId} />;
}
