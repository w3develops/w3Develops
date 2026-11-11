'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, limit, query, where } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import type { Appeal, Report } from '@/lib/types';

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

/**
 * How many things wait for a moderator: reported posts, replies and members
 * (reports about the same post or reply count once) plus open appeals. Null
 * for everyone else. The /moderation tabs show the same lists.
 */
export function useModerationCount(): number | null {
  const isModerator = useIsModerator();
  const firestore = useFirestore();
  const reportsQuery = useMemo(
    () => (isModerator ? query(collection(firestore, 'reports'), where('status', '==', 'open'), limit(200)) : null),
    [firestore, isModerator],
  );
  const appealsQuery = useMemo(
    () => (isModerator ? query(collection(firestore, 'appeals'), where('status', '==', 'open'), limit(200)) : null),
    [firestore, isModerator],
  );
  const { data: reports } = useCollection<Report>(reportsQuery);
  const { data: appeals } = useCollection<Appeal>(appealsQuery);
  if (!isModerator || !reports || !appeals) return null;
  const items = new Set(reports.map(report => (report.postId ? `${report.postId}/${report.replyId ?? ''}` : report.id)));
  return items.size + appeals.length;
}
