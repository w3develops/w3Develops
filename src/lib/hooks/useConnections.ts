'use client';

import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useCollection, useFirestore } from '@/firebase';

/** A mentorship, tutorship or pairing, with role fields like `mentorId` */
export interface Connection {
    id: string;
    memberIds: string[];
    [roleField: string]: unknown;
}

/**
 * The member's mentorships, tutorships or pairings. A connection's
 * `memberIds` is the record of who's in it, and the rules only let members
 * list connections that include them.
 */
export function useConnections(collectionName: string, uid: string | null | undefined) {
    const firestore = useFirestore();
    const connectionsQuery = useMemo(
        () => uid ? query(collection(firestore, collectionName), where('memberIds', 'array-contains', uid)) : null,
        [firestore, collectionName, uid],
    );
    return useCollection<Connection>(connectionsQuery);
}
