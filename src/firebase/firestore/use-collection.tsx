'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/** The latest data Firestore sent, tagged with the query or reference it answers */
interface Latest<D> {
  source: unknown;
  data: D | null;
  error: FirestoreError | Error | null;
}
const NOTHING_YET = { source: null, data: null, error: null };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: T[] | null; // Document data, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted targetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    targetRefOrQuery: (CollectionReference<DocumentData> | Query<DocumentData>) | null | undefined,
): UseCollectionResult<WithId<T>> {
  
  // The latest results, and which query they came from
  const [latest, setLatest] = useState<Latest<WithId<T>[]>>(NOTHING_YET);

  // Forget old results once there's nothing to listen to
  if (!targetRefOrQuery && latest.source !== null) {
    setLatest(NOTHING_YET);
  }

  useEffect(() => {
    if (!targetRefOrQuery) return;

    const unsubscribe = onSnapshot(
      targetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        // Defensive check: ensure snapshot has docs before mapping.
        // This avoids errors if a DocumentReference is accidentally passed here.
        if (!snapshot || !('docs' in snapshot)) {
          console.warn('useCollection received a snapshot that is not a QuerySnapshot. Expected a collection or query.');
          setLatest({ source: targetRefOrQuery, data: [], error: null });
          return;
        }

        const results = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
        setLatest({ source: targetRefOrQuery, data: results, error: null });
      },
      (err: FirestoreError) => {
        setLatest({ source: targetRefOrQuery, data: null, error: err });
      }
    );

    return () => unsubscribe();
  }, [targetRefOrQuery]); // Re-run if the target query/reference changes.

  if (!targetRefOrQuery) return { data: null, isLoading: false, error: null };
  // Waiting on a new query: keep showing the previous results meanwhile
  if (latest.source !== targetRefOrQuery) return { data: latest.data, isLoading: true, error: null };
  return { data: latest.data, isLoading: false, error: latest.error };
}
