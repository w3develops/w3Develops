import ConnectionSpace from '@/components/ConnectionSpace';

export async function generateStaticParams() {
  return [];
}

export default async function Page({ params }: { params: Promise<{ mentorshipId: string }> }) {
  const resolvedParams = await params;
  return <ConnectionSpace kind="mentorship" id={resolvedParams.mentorshipId} />;
}
