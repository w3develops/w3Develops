import { notFound, redirect } from 'next/navigation';
import { readDoc } from '@/lib/server-db';

// /u/<username> goes to that member's profile, so @mentions in feed posts can
// link by name. Usernames are public (usernames/{lowercase name} → uid).
export default async function UsernamePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const name = username.toLowerCase();
  if (!/^[a-z0-9]{3,24}$/.test(name)) notFound();
  const claim = await readDoc('usernames', name).catch(() => null);
  const uid = claim?.data.uid;
  if (typeof uid !== 'string') notFound();
  redirect(`/users/${uid}`);
}
