import UserProfilePage from './client';

export async function generateStaticParams() {
  return [];
}

export default async function Page({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = await params;
  return <UserProfilePage params={resolvedParams} />;
}
