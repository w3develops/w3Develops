import type { Metadata } from 'next';
import GroupListPage from '@/components/groups/GroupListPage';

export const metadata: Metadata = { title: 'Study Groups | w3Develops' };

export default function Page() {
  return <GroupListPage kind="studyGroup" />;
}
