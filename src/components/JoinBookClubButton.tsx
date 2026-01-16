
'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { arrayUnion, doc, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { BookClub } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ONE_WEEK_IN_MS } from '@/lib/constants';

export default function JoinBookClubButton({ club, onJoinSuccess }: { club: BookClub, onJoinSuccess?: (id: string) => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const router = useRouter();
    const [isJoining, setIsJoining] = useState(false);
    
    if (!user) return null;

    const isMember = club.memberIds.includes(user.uid);
    const isFull = club.memberIds.length >= 25;
    const isNew = club.createdAt && (Date.now() - club.createdAt.toMillis()) < ONE_WEEK_IN_MS;
    const canJoin = isNew && !isFull && !isMember;

    if (isMember) {
        return (
            <Button variant="outline" asChild size="sm">
                <Link href={`/book-clubs/${club.id}`}>View Club</Link>
            </Button>
        );
    }
    
    if (isFull) {
         return <Button size="sm" disabled>Club Full</Button>;
    }
    
    const handleJoin = async () => {
        if(isMember) {
            toast({ variant: 'destructive', title: 'Already a Member', description: 'You are already a member of this club.' });
            return;
        }

        if (!isNew) {
            toast({
                variant: "destructive",
                title: "Unable to Join",
                description: "This club is already in progress. You can only join clubs marked as 'New'.",
                duration: 6000,
            });
            return;
        }

        setIsJoining(true);

        try {
            const clubRef = doc(firestore, 'bookClubs', club.id);
            const userProfileRef = doc(firestore, 'users', user.uid);
            const batch = writeBatch(firestore);
            
            batch.update(clubRef, { memberIds: arrayUnion(user.uid) });
            batch.update(userProfileRef, { joinedBookClubIds: arrayUnion(club.id) });

            if (club.memberIds.length + 1 === 25) {
                const message = `Your book club "${club.name}" is now full!`;
                const link = `/book-clubs/${club.id}`;
                const allMemberIds = [...club.memberIds, user.uid];

                allMemberIds.forEach(memberId => {
                    const notificationRef = doc(collection(firestore, 'users', memberId, 'notifications'));
                    batch.set(notificationRef, {
                        id: notificationRef.id,
                        message,
                        link,
                        isRead: false,
                        createdAt: serverTimestamp(),
                    });
                });
                toast({ title: 'Club Full!', description: `Notifications sent to all members.`});
            }

            await batch.commit();

            toast({ title: 'Success!', description: `You've joined the club: ${club.name}` });

            if (onJoinSuccess) {
                onJoinSuccess(club.id);
            } else {
                router.push(`/book-clubs/${club.id}`);
            }

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Could Not Join', description: error.message || "An unexpected error occurred." });
        } finally {
            setIsJoining(false);
        }
    };
    
    if (!isNew && !isMember) {
      return (
          <Button disabled size="sm">
              <PlusCircle className="w-4 h-4 mr-2" />
              Join Club
          </Button>
      );
    }

    return (
        <Button onClick={handleJoin} disabled={isJoining || !canJoin} size="sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            {isJoining ? 'Joining...' : 'Join Club'}
        </Button>
    );
}

    