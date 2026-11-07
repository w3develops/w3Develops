import type { Metadata } from 'next';
import GroupListPage from '@/components/groups/GroupListPage';

export const metadata: Metadata = { title: 'Book Clubs | w3Develops' };

export default function Page() {
  return <GroupListPage kind="bookClub" />;
}
