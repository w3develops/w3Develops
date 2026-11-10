'use client';

import { useCallback } from 'react';
import { collection, doc, getDocs, serverTimestamp, writeBatch, type Firestore } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { MODERATED_ITEMS, type ModeratedKind } from '@/lib/moderated-items';

// Firestore takes at most 500 writes in one save
const BATCH_LIMIT = 450;

function logEntry(actorId: string, action: 'edit-content' | 'delete-content', contentPath: string, targetUserId: string, note: string) {
  return { actorId, action, contentPath, targetUserId, note: note.trim(), createdAt: serverTimestamp() };
}

async function deleteInBatches(firestore: Firestore, paths: string[]) {
  for (let i = 0; i < paths.length; i += BATCH_LIMIT) {
    const batch = writeBatch(firestore);
    paths.slice(i, i + BATCH_LIMIT).forEach(path => batch.delete(doc(firestore, path)));
    await batch.commit();
  }
}

/**
 * A moderator's edits and deletions of members' items, each saved with its
 * moderationLog entry in the same write, as firestore.rules requires.
 */
export function useItemModeration() {
  const firestore = useFirestore();
  const { user } = useUser();

  /** Changes an item's wording; `values` are the fields from MODERATED_ITEMS */
  const editItem = useCallback(
    async (kind: ModeratedKind, id: string, ownerId: string, values: Record<string, string>, note: string) => {
      if (!user) throw new Error('Not signed in');
      const fields = MODERATED_ITEMS[kind].fields as Record<string, { lowercase?: string }>;
      const change: Record<string, string> = {};
      for (const [key, value] of Object.entries(values)) {
        change[key] = value.trim();
        const lowercase = fields[key]?.lowercase;
        if (lowercase) change[lowercase] = value.trim().toLowerCase();
      }
      const logRef = doc(collection(firestore, 'moderationLog'));
      const batch = writeBatch(firestore);
      batch.set(logRef, logEntry(user.uid, 'edit-content', `${kind}/${id}`, ownerId, note));
      batch.update(doc(firestore, kind, id), { ...change, moderationLogId: logRef.id });
      await batch.commit();
    },
    [firestore, user],
  );

  /**
   * Deletes an item and its tasks, check-ins and the like. The item and its
   * log entry go first, in one save; the rules then let the rest follow.
   */
  const deleteItem = useCallback(
    async (kind: ModeratedKind, id: string, ownerId: string, note: string) => {
      if (!user) throw new Error('Not signed in');
      const partPaths: string[] = [];
      for (const part of MODERATED_ITEMS[kind].parts) {
        const snap = await getDocs(collection(firestore, kind, id, part));
        snap.forEach(partDoc => partPaths.push(partDoc.ref.path));
      }
      const batch = writeBatch(firestore);
      batch.set(doc(firestore, 'moderationLog', `delete-${kind}-${id}`), logEntry(user.uid, 'delete-content', `${kind}/${id}`, ownerId, note));
      batch.delete(doc(firestore, kind, id));
      partPaths.slice(0, BATCH_LIMIT).forEach(path => batch.delete(doc(firestore, path)));
      await batch.commit();
      await deleteInBatches(firestore, partPaths.slice(BATCH_LIMIT));
    },
    [firestore, user],
  );

  /** Deletes one check-in, update, task or entry of an item */
  const deletePart = useCallback(
    async (kind: ModeratedKind, id: string, part: string, partId: string, ownerId: string, note: string) => {
      if (!user) throw new Error('Not signed in');
      const batch = writeBatch(firestore);
      batch.set(
        doc(firestore, 'moderationLog', `delete-${kind}-${id}-${part}-${partId}`),
        logEntry(user.uid, 'delete-content', `${kind}/${id}/${part}/${partId}`, ownerId, note),
      );
      batch.delete(doc(firestore, kind, id, part, partId));
      await batch.commit();
    },
    [firestore, user],
  );

  return { editItem, deleteItem, deletePart };
}
