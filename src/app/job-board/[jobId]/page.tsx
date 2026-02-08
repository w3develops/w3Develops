import JobDetailsPageClient from './client';

export async function generateStaticParams() {
  // We can't statically generate job pages at build time as they are dynamic
  return [];
}

export default function JobDetailsPage({ params }: { params: { jobId: string } }) {
  return <JobDetailsPageClient params={params} />;
}
