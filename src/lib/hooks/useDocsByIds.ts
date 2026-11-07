'use client';

import { useMemo } from 'react';
import { collection, documentId, query, where } from 'firebase/firestore';
import { useCollection, useFirestore } from '@/firebase';

// Firestore's "in" filter takes at most 10 values, so only the first 10 load
const MAX_IDS = 10;

/** Loads the documents with these IDs from one collection (the first 10) */
export function useDocsByIds<T>(collectionName: string, ids: string[] | undefined) {
    const firestore = useFirestore();
    const firstIds = (ids ?? []).slice(0, MAX_IDS);
    const key = firstIds.join(',');

    const docsQuery = useMemo(() => {
        if (firstIds.length === 0) return null;
        return query(collection(firestore, collectionName), where(documentId(), 'in', firstIds));
        // `key` stands in for the ids array, which is a new array on every render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firestore, collectionName, key]);

    return useCollection<T>(docsQuery);
}
