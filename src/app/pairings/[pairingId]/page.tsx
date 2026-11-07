import ConnectionSpace from '@/components/ConnectionSpace';

export async function generateStaticParams() {
  return [];
}

export default async function Page({ params }: { params: Promise<{ pairingId: string }> }) {
  const resolvedParams = await params;
  return <ConnectionSpace kind="pairing" id={resolvedParams.pairingId} />;
}
