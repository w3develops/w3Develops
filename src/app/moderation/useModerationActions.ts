'use client';

import { useCallback } from 'react';
import { Timestamp, collection, deleteField, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import type { ModerationAction } from '@/lib/member-posts';
import type { MemberStanding } from '@/lib/types';

export type ModeratorAction = Exclude<ModerationAction, 'auto-hide'>;

export interface ActionRequest {
  action: ModeratorAction;
  targetUserId: string;
  postId?: string;
  note: string;
  /** Open reports this action settles; they're closed in the same save */
  reportIds?: string[];
  /** For a suspension */
  days?: number;
}

/** Actions that settle the reports about a post */
const CLOSES_REPORTS: ModeratorAction[] = ['hide', 'restore', 'delete', 'dismiss'];

/**
 * Carries out a moderator's action with its moderationLog entry in one save,
 * as firestore.rules requires: every change a moderator makes is on the
 * record.
 */
export function useModerationActions() {
  const firestore = useFirestore();
  const { user } = useUser();

  return useCallback(
    async ({ action, targetUserId, postId, note, reportIds = [], days }: ActionRequest) => {
      if (!user) throw new Error('Not signed in');
      const batch = writeBatch(firestore);
      // A deletion's entry is named after the post, so the rules can find it
      const logRef = action === 'delete' && postId
        ? doc(firestore, 'moderationLog', `delete-${postId}`)
        : doc(collection(firestore, 'moderationLog'));
      batch.set(logRef, {
        actorId: user.uid,
        action,
        targetUserId,
        ...(postId && { postId }),
        note: note.trim(),
        createdAt: serverTimestamp(),
      });

      const postRef = postId ? doc(firestore, 'memberPosts', postId) : null;
      if (postRef && action === 'hide') {
        batch.update(postRef, { status: 'hidden', hiddenBy: 'moderator', moderationLogId: logRef.id });
      } else if (postRef && action === 'restore') {
        batch.update(postRef, { status: 'visible', hiddenBy: deleteField(), moderationLogId: logRef.id });
      } else if (postRef && action === 'delete') {
        batch.delete(postRef);
      }

      if (action === 'warn' || action === 'suspend' || action === 'unsuspend') {
        const standingRef = doc(firestore, 'memberStandings', targetUserId);
        const current = (await getDoc(standingRef)).data() as MemberStanding | undefined;
        const standing: Record<string, unknown> = {
          warnings: (current?.warnings ?? 0) + (action === 'warn' ? 1 : 0),
          suspendedUntil: current?.suspendedUntil ?? null,
          lastLogId: logRef.id,
          updatedAt: serverTimestamp(),
        };
        if (current?.lastWarning) standing.lastWarning = current.lastWarning;
        if (action === 'warn') standing.lastWarning = note.trim();
        if (action === 'suspend') standing.suspendedUntil = Timestamp.fromMillis(Date.now() + (days ?? 1) * 24 * 60 * 60 * 1000);
        if (action === 'unsuspend') standing.suspendedUntil = null;
        batch.set(standingRef, standing);
      }

      if (CLOSES_REPORTS.includes(action)) {
        for (const reportId of reportIds) {
          batch.update(doc(firestore, 'reports', reportId), { status: 'closed', closedBy: user.uid, closedAt: serverTimestamp() });
        }
      }

      await batch.commit();
    },
    [firestore, user],
  );
}
