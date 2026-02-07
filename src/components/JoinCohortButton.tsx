
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { arrayUnion, doc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { GroupProject } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ONE_WEEK_IN_MS } from '@/lib/constants';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function JoinCohortButton({ groupProject, onJoinSuccess }: { groupProject: GroupProject, onJoinSuccess?: (id: string) => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const router = useRouter();
    const [isJoining, setIsJoining] = useState(false);
    
    if (!user) return null;

    const isMember = groupProject.memberIds.includes(user.uid);
    const isFull = groupProject.memberIds.length >= 25;
    const isNew = groupProject.createdAt && (Date.now() - groupProject.createdAt.toMillis()) < ONE_WEEK_IN_MS;
    const canJoin = isNew && !isFull && !isMember;

    if (isMember) {
        return (
            <Button variant="outline" asChild size="sm">
                <Link href={`/groupprojects/${groupProject.id}`}>View Project</Link>
            </Button>
        );
    }

    if (isFull) {
        return <Button size="sm" disabled>Project Full</Button>;
    }
    
    const handleJoin = async () => {
        if(isMember) {
            toast({ variant: 'destructive', title: 'Already a Member', description: 'You are already a member of this project.' });
            return;
        }

        if (!isNew) {
            toast({
                variant: "destructive",
                title: "Unable to Join",
                description: "This project is already in progress. You can only join projects marked as 'New'.",
                duration: 6000,
            });
            return;
        }

        setIsJoining(true);
        
        const groupProjectRef = doc(firestore, 'groupProjects', groupProject.id);
        const userProfileRef = doc(firestore, 'users', user.uid);
        const batch = writeBatch(firestore);

        batch.update(groupProjectRef, { memberIds: arrayUnion(user.uid) });
        batch.update(userProfileRef, { joinedGroupProjectIds: arrayUnion(groupProject.id) });


        if (groupProject.memberIds.length + 1 === 25) {
            const message = `Your group project "${groupProject.name}" is now full!`;
            const link = `/groupprojects/${groupProject.id}`;
            const allMemberIds = [...groupProject.memberIds, user.uid];
            
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
        }
        
        batch.commit()
            .then(() => {
                if (groupProject.memberIds.length + 1 === 25) {
                    toast({ title: 'Project Full!', description: `Notifications sent to all members.`});
                }
                toast({ title: 'Success!', description: `You've joined the project: ${groupProject.name}`});
                
                if (onJoinSuccess) {
                    onJoinSuccess(groupProject.id);
                } else {
                    router.push(`/groupprojects/${groupProject.id}`);
                }
            })
            .catch(error => {
                const permissionError = new FirestorePermissionError({
                    path: `batch write to join group project ${groupProject.id}`,
                    operation: 'update',
                    requestResourceData: { groupProjectId: groupProject.id, userId: user.uid }
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Could Not Join', description: "A permission error occurred." });
            })
            .finally(() => {
                setIsJoining(false);
            });
    };

    if (!isNew && !isMember) {
      return (
          <Button disabled size="sm">
              <PlusCircle className="w-4 h-4 mr-2" />
              Join Project
          </Button>
      );
    }

    return (
        <Button onClick={handleJoin} disabled={isJoining || !canJoin} size="sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            {isJoining ? 'Joining...' : 'Join Project'}
        </Button>
    );
}
