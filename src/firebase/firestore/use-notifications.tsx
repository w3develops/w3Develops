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
  // The latest count, and which query it came from
  const [latest, setLatest] = useState<{ source: unknown; count: number }>({ source: null, count: 0 });

  const notificationsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      where('isRead', '==', false)
    );
  }, [user, firestore]);

  useEffect(() => {
    if (!notificationsQuery) return;

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        setLatest({ source: notificationsQuery, count: snapshot.size });
      },
      (error: FirestoreError) => {
        console.error("useNotifications error:", error);
        setLatest({ source: notificationsQuery, count: 0 });
      }
    );

    return () => unsubscribe();
  }, [notificationsQuery]);

  // 0 when signed out or while the first count loads
  return notificationsQuery && latest.source === notificationsQuery ? latest.count : 0;
}
