import type { Metadata } from 'next';
import JobDetailsPageClient from './client';
import { getPublicItem, itemMetadata } from '@/lib/public-items';

type Props = { params: Promise<{ jobId: string }> };

// Rendered on the server with the job's details, then kept live in the browser
export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { jobId } = await params;
  const item = await getPublicItem('jobs', jobId);
  return itemMetadata(item, {
    path: `/job-board/${jobId}`,
    name: item ? `${item.title} at ${item.companyName}` : undefined,
    fallbackDescription: 'A tech job shared on the w3Develops job board.',
    kindLabel: 'Job',
  });
}

export default async function Page({ params }: Props) {
  const { jobId } = await params;
  const item = await getPublicItem('jobs', jobId);
  return <JobDetailsPageClient params={{ jobId }} initialJob={item ?? undefined} />;
}
