import type { Metadata } from 'next';
import GroupListPage from '@/components/groups/GroupListPage';
import { pageMetadata } from '@/lib/site-pages';

export const metadata: Metadata = pageMetadata('/groupprojects');

export default function Page() {
  return <GroupListPage kind="groupProject" />;
}
