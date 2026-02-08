'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  FirestoreError,
} from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase/provider';

/**
 * React hook to get the count of unread notifications for the current user in real-time.
 * @returns {number} The number of unread notifications.
 */
export function useNotifications(): number {
  const { user } = useUser();
  const firestore = useFirestore();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const notificationsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      where('isRead', '==', false)
    );
  }, [user, firestore]);

  useEffect(() => {
    if (!notificationsQuery) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        setUnreadCount(snapshot.size);
      },
      (error: FirestoreError) => {
        console.error("useNotifications error:", error);
        setUnreadCount(0);
      }
    );

    return () => unsubscribe();
  }, [notificationsQuery]);

  return unreadCount;
}
