import PairingDashboardPage from './client';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { pairingId: string } }) {
  return <PairingDashboardPage params={params} />;
}
