import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';
import { getPublicList } from '@/lib/public-items';
import MemberFeed from './MemberFeed';

// Rendered with the latest posts at most every five minutes
export const revalidate = 300;

export const metadata: Metadata = pageMetadata('/feed');

export default async function FeedPage() {
  // Only visible public posts: the server reads skip the Firestore rules
  const initial = await getPublicList({
    collection: 'memberPosts',
    equals: [{ field: 'status', value: 'visible' }, { field: 'audience', value: 'public' }],
    orderBy: 'createdAt',
    direction: 'desc',
    limit: 50,
  });
  return <MemberFeed initial={initial} />;
}
