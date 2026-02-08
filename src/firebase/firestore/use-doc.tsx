'use client';

import { useState, useEffect } from 'react';
import {
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentReference,
} from 'firebase/firestore';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a Firestore document in real-time.
 * Handles nullable references.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted docRef or BAD THINGS WILL HAPPEN.
 * Use useMemo to memoize it per React guidance. Also make sure that its dependencies are stable.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} docRef -
 * The Firestore DocumentReference. Waits if null/undefined.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = any>(
  docRef: DocumentReference<DocumentData> | null | undefined
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!docRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData({ ...(docSnap.data() as T), id: docSnap.id });
        } else {
          setData(null); // Document does not exist
        }
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        setError(err);
        setData(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef]); // Re-run if the reference changes.

  return { data, isLoading, error };
}
