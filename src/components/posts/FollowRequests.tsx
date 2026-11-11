'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { arrayUnion, collection, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import type { FollowRequest } from '@/lib/types';

/**
 * People asking to follow the signed-in member's private account. Accepting
 * adds them to the member's followers and removes the request in one save
 * (firestore.rules); functions/src/follows.ts then adds the member to their
 * following and tells them.
 */
export default function FollowRequests() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const requestsQuery = useMemo(
    () => (user ? query(collection(firestore, 'followRequests'), where('toId', '==', user.uid)) : null),
    [firestore, user],
  );
  const { data: requests } = useCollection<FollowRequest>(requestsQuery);
  if (!user || !requests || requests.length === 0) return null;
  const sorted = [...requests].sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));

  const answer = async (request: FollowRequest, accept: boolean) => {
    setBusyId(request.id);
    try {
      const requestRef = doc(firestore, 'followRequests', request.id);
      if (accept) {
        const batch = writeBatch(firestore);
        batch.update(doc(firestore, 'users', user.uid), { followers: arrayUnion(request.fromId) });
        batch.delete(requestRef);
        await batch.commit();
      } else {
        await deleteDoc(requestRef);
      }
      toast({ title: accept ? `${request.fromName} now follows you` : 'Request declined' });
    } catch {
      toast({ variant: 'destructive', title: 'Something went wrong', description: 'Please try again.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div id="follow-requests" className="space-y-2 scroll-mt-20">
      <p className="text-sm font-medium">Follow requests ({sorted.length})</p>
      <ul className="space-y-2">
        {sorted.map(request => (
          <li key={request.id} className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={request.fromPhoto || undefined} alt="" />
              <AvatarFallback>{request.fromName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Link href={`/users/${request.fromId}`} className="min-w-0 flex-1 truncate text-sm hover:underline">{request.fromName}</Link>
            <Button size="sm" onClick={() => answer(request, true)} disabled={busyId === request.id}>Accept</Button>
            <Button size="sm" variant="ghost" onClick={() => answer(request, false)} disabled={busyId === request.id}>Decline</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
