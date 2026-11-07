import type { Metadata } from 'next';
import GroupDashboard from '@/components/groups/GroupDashboard';
import { getPublicItem, itemMetadata } from '@/lib/public-items';

type Props = { params: Promise<{ groupProjectId: string }> };

// Rendered on the server with the group project's details, then kept live in the browser
export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { groupProjectId } = await params;
  const item = await getPublicItem('groupProjects', groupProjectId);
  return itemMetadata(item, {
    path: `/groupprojects/${groupProjectId}`,
    name: item?.name as string | undefined,
    fallbackDescription: 'A free collaborative coding project on w3Develops.',
    kindLabel: 'Group Project',
  });
}

export default async function Page({ params }: Props) {
  const { groupProjectId } = await params;
  const item = await getPublicItem('groupProjects', groupProjectId);
  return <GroupDashboard kind="groupProject" groupId={groupProjectId} initialGroup={item ?? undefined} />;
}
