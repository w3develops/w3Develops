import ConnectionSpace from '@/components/ConnectionSpace';

export async function generateStaticParams() {
  return [];
}

export default async function Page({ params }: { params: Promise<{ tutorshipId: string }> }) {
  const resolvedParams = await params;
  return <ConnectionSpace kind="tutorship" id={resolvedParams.tutorshipId} />;
}
