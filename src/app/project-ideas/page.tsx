import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';
import ProjectIdeas from './ProjectIdeas';

export const metadata: Metadata = pageMetadata('/project-ideas');

export default function ProjectIdeasPage() {
  return <ProjectIdeas />;
}
