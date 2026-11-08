import type { Metadata } from 'next';
import GroupListPage from '@/components/groups/GroupListPage';
import { pageMetadata } from '@/lib/site-pages';
import { getInitialGroups } from '@/lib/list-pages';

// Rendered with the current groups at most every five minutes
export const revalidate = 300;

export const metadata: Metadata = pageMetadata('/groupprojects');

export default async function Page() {
  return <GroupListPage kind="groupProject" initial={await getInitialGroups('groupProject')} />;
}
