
'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Meetup } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function JoinMeetupButton({ meetup }: { meetup: Meetup }) {
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const router = useRouter();
    const [isJoining, setIsJoining] = useState(false);
    
    if (!user) return (
        <Button asChild size="sm">
            <Link href={`/login?redirect=/meetups/${meetup.id}`}>Login to Join</Link>
        </Button>
    );

    const isMember = meetup.attendeeIds.includes(user.uid);

    if (isMember) {
        return (
            <Button variant="outline" asChild size="sm">
                <Link href={`/meetups/${meetup.id}`}>View Details</Link>
            </Button>
        );
    }
    
    const handleJoin = async () => {
        setIsJoining(true);
        const meetupRef = doc(firestore, 'meetups', meetup.id);
        const updateData = { attendeeIds: arrayUnion(user.uid) };

        try {
            await updateDoc(meetupRef, updateData);
            toast({ title: 'Success!', description: `You've joined the meetup: ${meetup.name}` });
            router.refresh();
        } catch (error: any) {
            const permissionError = new FirestorePermissionError({
                path: meetupRef.path,
                operation: 'update',
                requestResourceData: { attendeeId: user.uid },
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Could Not Join', description: "Could not join the meetup due to a permission error." });
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <Button onClick={handleJoin} disabled={isJoining} size="sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            {isJoining ? 'Joining...' : 'Join Meetup'}
        </Button>
    );
}
