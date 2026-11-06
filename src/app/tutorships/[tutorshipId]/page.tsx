import ConnectionSpace from '@/components/ConnectionSpace';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { tutorshipId: string } }) {
  return <ConnectionSpace kind="tutorship" id={params.tutorshipId} />;
}
