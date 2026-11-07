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

/** The latest document Firestore sent, tagged with the reference it answers */
interface Latest<D> {
  source: unknown;
  data: D | null;
  error: FirestoreError | Error | null;
}
const NOTHING_YET = { source: null, data: null, error: null };

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
  // The latest document, and which reference it came from
  const [latest, setLatest] = useState<Latest<WithId<T>>>(NOTHING_YET);

  // Forget the old document once there's nothing to listen to
  if (!docRef && latest.source !== null) {
    setLatest(NOTHING_YET);
  }

  useEffect(() => {
    if (!docRef) return;

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        // null when the document does not exist
        const data = docSnap.exists() ? { ...(docSnap.data() as T), id: docSnap.id } : null;
        setLatest({ source: docRef, data, error: null });
      },
      (err: FirestoreError) => {
        setLatest({ source: docRef, data: null, error: err });
      }
    );

    return () => unsubscribe();
  }, [docRef]); // Re-run if the reference changes.

  if (!docRef) return { data: null, isLoading: false, error: null };
  // Waiting on a new reference: keep showing the previous document meanwhile
  if (latest.source !== docRef) return { data: latest.data, isLoading: true, error: null };
  return { data: latest.data, isLoading: false, error: latest.error };
}
