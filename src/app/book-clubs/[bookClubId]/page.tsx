import GroupDashboard from '@/components/groups/GroupDashboard';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { bookClubId: string } }) {
  return <GroupDashboard kind="bookClub" groupId={params.bookClubId} />;
}
