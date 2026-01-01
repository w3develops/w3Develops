
'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { arrayUnion, doc, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { StudyGroup } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ONE_WEEK_IN_MS } from '@/lib/constants';

export default function JoinGroupButton({ group, onJoinSuccess }: { group: StudyGroup, onJoinSuccess?: (id: string) => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const router = useRouter();
    const [isJoining, setIsJoining] = useState(false);
    
    if (!user) return null;

    const isMember = group.memberIds.includes(user.uid);
    const isFull = group.memberIds.length >= 25;
    const isNew = group.createdAt && (Date.now() - group.createdAt.toMillis()) < ONE_WEEK_IN_MS;

    if (isMember) {
        return (
            <Button variant="outline" asChild size="sm">
                <Link href={`/studygroups/${group.id}`}>View Group</Link>
            </Button>
        );
    }
    
    if (isFull) {
         return <Button size="sm" disabled>Group Full</Button>;
    }
    
    const handleJoin = async () => {
        if(isMember) {
            toast({ variant: 'destructive', title: 'Already a Member', description: 'You are already a member of this group.' });
            return;
        }

        if (!isNew) {
            toast({
                variant: "destructive",
                title: "Unable to Join",
                description: "Unable to join groups \"In Progress\". Join a 'New' group or create one.",
                duration: 6000,
            });
            return;
        }

        setIsJoining(true);

        try {
            const groupRef = doc(firestore, 'studyGroups', group.id);
            const userProfileRef = doc(firestore, 'users', user.uid);
            const batch = writeBatch(firestore);
            
            batch.update(groupRef, { memberIds: arrayUnion(user.uid) });
            batch.update(userProfileRef, { joinedStudyGroupIds: arrayUnion(group.id) });

            if (group.memberIds.length + 1 === 25) {
                const message = `Your study group "${group.name}" is now full!`;
                const link = `/studygroups/${group.id}`;
                const allMemberIds = [...group.memberIds, user.uid];

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
                toast({ title: 'Group Full!', description: `Notifications sent to all members.`});
            }

            await batch.commit();

            toast({ title: 'Success!', description: `You've joined the group: ${group.name}` });

            if (onJoinSuccess) {
                onJoinSuccess(group.id);
            } else {
                router.push(`/studygroups/${group.id}`);
            }

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Could Not Join', description: error.message || "An unexpected error occurred." });
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <Button onClick={handleJoin} disabled={isJoining} size="sm">
            <PlusCircle class="w-4 h-4 mr-2" />
            {isJoining ? 'Joining...' : 'Join Group'}
        </Button>
    );
}
