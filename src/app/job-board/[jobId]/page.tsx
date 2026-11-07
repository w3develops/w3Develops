import JobDetailsPageClient from './client';

export async function generateStaticParams() {
  // We can't statically generate job pages at build time as they are dynamic
  return [];
}

export default async function JobDetailsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const resolvedParams = await params;
  return <JobDetailsPageClient params={resolvedParams} />;
}
