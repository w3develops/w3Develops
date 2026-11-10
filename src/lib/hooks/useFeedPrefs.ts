'use client';

import { useCallback, useMemo } from 'react';
import { arrayRemove, arrayUnion, doc, setDoc, writeBatch } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
import type { FeedPrefs } from '@/lib/types';

const NONE: string[] = [];

/**
 * The signed-in member's feed settings (users/{uid}/private/feedPrefs): the
 * topics they follow and the members they muted or blocked, with ways to
 * change them. Muting only hides someone's posts; blocking also stops them
 * following you and removes them from your followers.
 */
export function useFeedPrefs() {
  const { user } = useUser();
  const firestore = useFirestore();
  const prefsRef = useMemo(() => (user ? doc(firestore, 'users', user.uid, 'private', 'feedPrefs') : null), [firestore, user]);
  const { data, isLoading } = useDoc<FeedPrefs>(prefsRef);

  const topics = data?.topics ?? NONE;
  const mutedIds = data?.mutedIds ?? NONE;
  const blockedIds = data?.blockedIds ?? NONE;

  const update = useCallback(
    (changes: Partial<Record<keyof FeedPrefs, ReturnType<typeof arrayUnion>>>) => {
      if (!prefsRef) return Promise.reject(new Error('Not signed in'));
      return setDoc(prefsRef, changes, { merge: true });
    },
    [prefsRef],
  );

  const block = useCallback(
    (memberId: string) => {
      if (!user || !prefsRef) return Promise.reject(new Error('Not signed in'));
      const batch = writeBatch(firestore);
      batch.set(prefsRef, { blockedIds: arrayUnion(memberId), mutedIds: arrayRemove(memberId) }, { merge: true });
      // They stop following you; you stop following them
      batch.update(doc(firestore, 'users', user.uid), { followers: arrayRemove(memberId), following: arrayRemove(memberId) });
      return batch.commit();
    },
    [firestore, prefsRef, user],
  );

  return {
    isLoading,
    topics,
    mutedIds,
    blockedIds,
    followTopic: (topic: string) => update({ topics: arrayUnion(topic) }),
    unfollowTopic: (topic: string) => update({ topics: arrayRemove(topic) }),
    mute: (memberId: string) => update({ mutedIds: arrayUnion(memberId) }),
    unmute: (memberId: string) => update({ mutedIds: arrayRemove(memberId) }),
    block,
    unblock: (memberId: string) => update({ blockedIds: arrayRemove(memberId) }),
  };
}
