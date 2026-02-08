import UserProfilePage from './client';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { userId: string } }) {
  return <UserProfilePage params={params} />;
}
