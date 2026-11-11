'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { arrayRemove, arrayUnion, collection, doc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
import type { FeedPrefs, UserProfile } from '@/lib/types';

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
  const profileRef = useMemo(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(profileRef);
  // The flag is on the public profile, so others' Follow buttons know to ask.
  // Accounts made private before that only have it in feedPrefs: copy it over.
  const privateAccount = profile?.privateAccount === true || data?.privateAccount === true;
  const needsCopy = !!profile && data?.privateAccount === true && profile.privateAccount !== true;
  useEffect(() => {
    if (needsCopy && profileRef) updateDoc(profileRef, { privateAccount: true }).catch(() => {});
  }, [needsCopy, profileRef]);

  const topics = data?.topics ?? NONE;
  const mutedIds = data?.mutedIds ?? NONE;
  const blockedIds = data?.blockedIds ?? NONE;

  const update = useCallback(
    (changes: Partial<Record<'topics' | 'mutedIds' | 'blockedIds', ReturnType<typeof arrayUnion>>>) => {
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

  /**
   * Makes the account private or public. Going private also makes every
   * public post they've made followers-only, since a private account's posts
   * are for followers (firestore.rules: isAllowedAudience). Going public
   * leaves their posts as they are; they can open each one up. People who
   * already follow them keep following; new people have to ask.
   */
  const setPrivateAccount = useCallback(
    async (isPrivate: boolean) => {
      if (!user || !prefsRef) throw new Error('Not signed in');
      if (isPrivate) {
        const publicPosts = await getDocs(query(collection(firestore, 'memberPosts'), where('authorId', '==', user.uid), where('audience', '==', 'public')));
        const refs = publicPosts.docs.map(post => post.ref);
        for (let i = 0; i < refs.length; i += 450) {
          const batch = writeBatch(firestore);
          refs.slice(i, i + 450).forEach(ref => batch.update(ref, { audience: 'followers' }));
          await batch.commit();
        }
      }
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, 'users', user.uid), { privateAccount: isPrivate });
      batch.set(prefsRef, { privateAccount: isPrivate }, { merge: true });
      await batch.commit();
    },
    [firestore, prefsRef, user],
  );

  return {
    isLoading,
    privateAccount,
    setPrivateAccount,
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
