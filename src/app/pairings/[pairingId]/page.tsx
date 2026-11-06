import ConnectionSpace from '@/components/ConnectionSpace';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { pairingId: string } }) {
  return <ConnectionSpace kind="pairing" id={params.pairingId} />;
}
