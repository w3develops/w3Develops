'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { arrayUnion, arrayRemove, doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface FollowButtonProps {
    targetUserId: string;
    targetUserFollowers: string[];
}

export default function FollowButton({ targetUserId, targetUserFollowers }: FollowButtonProps) {
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!user || !firestore || user.uid === targetUserId) {
        return null; // Don't show button if not logged in or on own profile
    }

    const isFollowing = targetUserFollowers?.includes(user.uid);

    const handleFollowToggle = async () => {
        setIsSubmitting(true);
        const currentUserRef = doc(firestore, 'users', user.uid);
        const targetUserRef = doc(firestore, 'users', targetUserId);
        const batch = writeBatch(firestore);
        
        let batchUpdateData = {};

        if (isFollowing) {
            // Unfollow action
            batch.update(currentUserRef, { following: arrayRemove(targetUserId) });
            batch.update(targetUserRef, { followers: arrayRemove(user.uid) });
            batchUpdateData = { following: { action: 'remove', id: targetUserId }, followers: {action: 'remove', id: user.uid }};
        } else {
            // Follow action
            batch.update(currentUserRef, { following: arrayUnion(targetUserId) });
            batch.update(targetUserRef, { followers: arrayUnion(user.uid) });
            batchUpdateData = { following: { action: 'add', id: targetUserId }, followers: {action: 'add', id: user.uid }};
        }

        batch.commit()
            .catch(error => {
                const permissionError = new FirestorePermissionError({
                    path: 'batch write for follow/unfollow',
                    operation: 'update',
                    requestResourceData: batchUpdateData
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not complete action due to a permission issue.'
                });
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    return (
        <Button onClick={handleFollowToggle} disabled={isSubmitting} variant={isFollowing ? 'secondary' : 'default'}>
            {isSubmitting ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
    );
}
