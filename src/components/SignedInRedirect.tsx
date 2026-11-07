'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';

/**
 * Shows `children` to visitors, search engines and AI crawlers, and sends
 * members who are signed in to `to` instead. The children are in the page's
 * HTML from the start, so crawlers that don't run JavaScript still see them.
 */
export default function SignedInRedirect({ to, children }: { to: string; children: ReactNode }) {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace(to);
  }, [user, router, to]);

  return user ? <LoadingSkeleton /> : children;
}
