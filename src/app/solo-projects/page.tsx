import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';
import { getPublicList } from '@/lib/public-items';
import SoloProjectList from './SoloProjectList';

// Rendered with the current projects at most every five minutes
export const revalidate = 300;

export const metadata: Metadata = pageMetadata('/solo-projects');

export default async function SoloProjectsPage() {
  return <SoloProjectList initial={await getPublicList({ collection: 'soloProjects', orderBy: 'createdAt', direction: 'desc', limit: 100 })} />;
}
