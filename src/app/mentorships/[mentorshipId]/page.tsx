import ConnectionSpace from '@/components/ConnectionSpace';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { mentorshipId: string } }) {
  return <ConnectionSpace kind="mentorship" id={params.mentorshipId} />;
}
