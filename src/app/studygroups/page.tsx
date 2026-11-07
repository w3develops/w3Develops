import type { Metadata } from 'next';
import GroupListPage from '@/components/groups/GroupListPage';
import { pageMetadata } from '@/lib/site-pages';

export const metadata: Metadata = pageMetadata('/studygroups');

export default function Page() {
  return <GroupListPage kind="studyGroup" />;
}
