'use client';

import { useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import type { User } from 'firebase/auth';
import { arrayUnion, collection, doc, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { GitBranch } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useDocsByIds } from '@/lib/hooks/useDocsByIds';
import { useVerifiedGuard } from '@/lib/hooks/useVerifiedGuard';
import type { PairingRequest, UserProfile } from '@/lib/types';

/** Pair programming requests and partners. Shown on the pair programming and account pages. */
export default function PairingDashboard({ user, userProfile, title = 'Pairing Dashboard', children }: {
  user: User;
  userProfile: UserProfile;
  title?: string;
  children?: ReactNode;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const incomingRequestsQuery = useMemo(() => query(
    collection(firestore, 'pairRequests'),
    where('toUid', '==', user.uid),
    where('status', '==', 'pending')
  ), [firestore, user.uid]);
  const { data: incomingRequests, isLoading: isLoadingRequests } = useCollection<PairingRequest>(incomingRequestsQuery);
  const { data: partners } = useDocsByIds<UserProfile>('users', userProfile.pairPartnerIds);

  const ensureVerified = useVerifiedGuard();
  const handleRequest = async (request: PairingRequest, newStatus: 'accepted' | 'declined') => {
    if (!ensureVerified()) return;
    const batch = writeBatch(firestore);
    batch.update(doc(firestore, 'pairRequests', request.id), { status: newStatus });
    let batchUpdateData = {};

    if (newStatus === 'accepted') {
      const sortedUserIds = [request.fromUid, user.uid].sort();
      const pairingId = sortedUserIds.join('_');
      batch.update(doc(firestore, 'users', request.fromUid), { pairingIds: arrayUnion(pairingId), pairPartnerIds: arrayUnion(user.uid) });
      batch.update(doc(firestore, 'users', user.uid), { pairingIds: arrayUnion(pairingId), pairPartnerIds: arrayUnion(request.fromUid) });
      batch.set(doc(firestore, 'pairings', pairingId), {
        id: pairingId,
        memberIds: sortedUserIds,
        createdAt: serverTimestamp()
      });
      batchUpdateData = { from: request.fromUid, to: user.uid, pairingId };
    }

    try {
      await batch.commit();
      toast({ title: `Request ${newStatus}` });
    } catch {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `batch write for pairing request ${request.id}`,
        operation: 'update',
        requestResourceData: batchUpdateData,
      }));
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to process request due to a permission issue. Please try again.",
        duration: 10000
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><GitBranch />{title}</CardTitle>
        <CardDescription>Manage your pair programming connections and requests.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Incoming Requests</h3>
          {isLoadingRequests && <p>Loading requests...</p>}
          {!isLoadingRequests && (!incomingRequests || incomingRequests.length === 0) && <p className="text-sm text-muted-foreground">No new requests.</p>}
          <div className="space-y-2">
            {incomingRequests?.map(req => (
              <div key={req.id} className="flex items-center justify-between p-2 border rounded-md">
                <p className="text-sm">{req.fromUsername} wants to pair with you.</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleRequest(req, 'accepted')}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => handleRequest(req, 'declined')}>Decline</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Your Partners</h3>
          {partners && partners.length > 0 ? (
            <ul className="divide-y">
              {partners.map(p => (
                <li key={p.id} className="py-2">
                  <Link href={`/pairings/${[user.uid, p.id].sort().join('_')}`} className="font-medium hover:underline">{p.username}</Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">You have no partners yet.</p>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
