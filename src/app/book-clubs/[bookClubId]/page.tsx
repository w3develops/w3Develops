import type { Metadata } from 'next';
import GroupDashboard from '@/components/groups/GroupDashboard';
import { getPublicItem, itemMetadata } from '@/lib/public-items';

type Props = { params: Promise<{ bookClubId: string }> };

// Rendered on the server with the book club's details, then kept live in the browser
export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bookClubId } = await params;
  const item = await getPublicItem('bookClubs', bookClubId);
  return itemMetadata(item, {
    path: `/book-clubs/${bookClubId}`,
    name: item?.name as string | undefined,
    fallbackDescription: 'A tech book club on w3Develops.',
    kindLabel: 'Book Club',
  });
}

export default async function Page({ params }: Props) {
  const { bookClubId } = await params;
  const item = await getPublicItem('bookClubs', bookClubId);
  return <GroupDashboard kind="bookClub" groupId={bookClubId} initialGroup={item ?? undefined} />;
}
