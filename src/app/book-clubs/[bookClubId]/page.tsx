
import BookClubDashboardPage from './client';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { bookClubId: string } }) {
  return <BookClubDashboardPage params={params} />;
}

    