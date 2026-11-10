'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';

export interface StaffRoles {
  /** Can review reports on /moderation (the `moderator` claim) */
  moderator: boolean;
  /** Can also add and remove moderators (the `admin` claim) */
  admin: boolean;
}

const NO_ROLES: StaffRoles = { moderator: false, admin: false };

/**
 * The signed-in member's staff roles, from their custom claims. Null while
 * they're being checked. This only decides what to show; firestore.rules and
 * the setModerator function check the claims themselves.
 */
export function useStaffRoles(): StaffRoles | null {
  const { user, isUserLoading } = useUser();
  const [result, setResult] = useState<{ uid: string; roles: StaffRoles } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    user.getIdTokenResult()
      .then(token => {
        if (!cancelled) setResult({ uid: user.uid, roles: { moderator: token.claims.moderator === true, admin: token.claims.admin === true } });
      })
      .catch(() => {
        if (!cancelled) setResult({ uid: user.uid, roles: NO_ROLES });
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isUserLoading) return null;
  if (!user) return NO_ROLES;
  return result?.uid === user.uid ? result.roles : null;
}

/** Whether the signed-in member has the `moderator` claim (scripts/set-moderator.mjs); null while checking */
export function useIsModerator(): boolean | null {
  const roles = useStaffRoles();
  return roles === null ? null : roles.moderator;
}
