'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';

/**
 * Whether the signed-in member has the `moderator` claim
 * (scripts/set-moderator.mjs). Null while it's being checked. This only
 * decides what to show; firestore.rules checks the claim on every read and
 * write.
 */
export function useIsModerator(): boolean | null {
  const { user, isUserLoading } = useUser();
  const [result, setResult] = useState<{ uid: string; isModerator: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    user.getIdTokenResult()
      .then(token => {
        if (!cancelled) setResult({ uid: user.uid, isModerator: token.claims.moderator === true });
      })
      .catch(() => {
        if (!cancelled) setResult({ uid: user.uid, isModerator: false });
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isUserLoading) return null;
  if (!user) return false;
  return result?.uid === user.uid ? result.isModerator : null;
}
