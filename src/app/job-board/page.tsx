import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';
import { getPublicList } from '@/lib/public-items';
import JobList from './JobList';

// Rendered with the current jobs at most every five minutes
export const revalidate = 300;

export const metadata: Metadata = pageMetadata('/job-board');

export default async function JobBoardPage() {
  return <JobList initial={await getPublicList({ collection: 'jobs', orderBy: 'createdAt', direction: 'desc', limit: 100 })} />;
}
