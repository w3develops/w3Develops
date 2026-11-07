import type { Metadata } from 'next';
import GroupDashboard from '@/components/groups/GroupDashboard';
import { getPublicItem, itemMetadata } from '@/lib/public-items';

type Props = { params: Promise<{ groupId: string }> };

// Rendered on the server with the study group's details, then kept live in the browser
export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { groupId } = await params;
  const item = await getPublicItem('studyGroups', groupId);
  return itemMetadata(item, {
    path: `/studygroups/${groupId}`,
    name: item?.name as string | undefined,
    fallbackDescription: 'A free remote coding study group on w3Develops.',
    kindLabel: 'Study Group',
  });
}

export default async function Page({ params }: Props) {
  const { groupId } = await params;
  const item = await getPublicItem('studyGroups', groupId);
  return <GroupDashboard kind="studyGroup" groupId={groupId} initialGroup={item ?? undefined} />;
}
