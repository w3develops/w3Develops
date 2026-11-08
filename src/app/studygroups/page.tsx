import type { Metadata } from 'next';
import GroupListPage from '@/components/groups/GroupListPage';
import { pageMetadata } from '@/lib/site-pages';
import { getInitialGroups } from '@/lib/list-pages';

// Rendered with the current groups at most every five minutes
export const revalidate = 300;

export const metadata: Metadata = pageMetadata('/studygroups');

export default async function Page() {
  return <GroupListPage kind="studyGroup" initial={await getInitialGroups('studyGroup')} />;
}
