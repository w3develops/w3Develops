'use client';

import { useMemo, useState } from 'react';
import { useVerifiedGuard } from '@/lib/hooks/useVerifiedGuard';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { arrayUnion, arrayRemove, deleteDoc, doc, getDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import type { FollowRequest } from '@/lib/types';

interface FollowButtonProps {
    targetUserId: string;
    targetUserFollowers: string[];
    /** A private account: people ask to follow it, and it accepts (firestore.rules: match /followRequests) */
    targetIsPrivate?: boolean;
}

export default function FollowButton({ targetUserId, targetUserFollowers, targetIsPrivate = false }: FollowButtonProps) {
    const { user } = useUser();
    const ensureVerified = useVerifiedGuard();
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isOwnProfile = user?.uid === targetUserId;
    const requestRef = useMemo(
        () => (user && targetIsPrivate && !isOwnProfile ? doc(firestore, 'followRequests', `${targetUserId}_${user.uid}`) : null),
        [firestore, user, targetIsPrivate, isOwnProfile, targetUserId],
    );
    const { data: request } = useDoc<FollowRequest>(requestRef);

    if (!user || !firestore || isOwnProfile) {
        return null; // Don't show button if not logged in or on own profile
    }

    const isFollowing = targetUserFollowers?.includes(user.uid);

    const run = async (action: () => Promise<unknown>, failure: string) => {
        setIsSubmitting(true);
        try {
            await action();
        } catch {
            toast({ variant: 'destructive', title: 'Something went wrong', description: failure });
        } finally {
            setIsSubmitting(false);
        }
    };

    const unfollow = () => {
        const batch = writeBatch(firestore);
        batch.update(doc(firestore, 'users', user.uid), { following: arrayRemove(targetUserId) });
        batch.update(doc(firestore, 'users', targetUserId), { followers: arrayRemove(user.uid) });
        return batch.commit();
    };

    const follow = () => {
        const batch = writeBatch(firestore);
        batch.update(doc(firestore, 'users', user.uid), { following: arrayUnion(targetUserId) });
        batch.update(doc(firestore, 'users', targetUserId), { followers: arrayUnion(user.uid) });
        return batch.commit();
    };

    const askToFollow = async () => {
        const me = (await getDoc(doc(firestore, 'users', user.uid))).data();
        await setDoc(requestRef!, {
            fromId: user.uid,
            toId: targetUserId,
            fromName: me?.username ?? '',
            fromPhoto: me?.profilePictureUrl ?? '',
            createdAt: serverTimestamp(),
        });
        toast({ title: 'Follow request sent', description: 'You’ll see their posts once they accept.' });
    };

    const handleClick = () => {
        if (isFollowing) return run(unfollow, 'Could not unfollow. Please try again.');
        if (!ensureVerified()) return;
        if (!targetIsPrivate) return run(follow, 'Could not follow. They may have blocked you.');
        if (request) return run(() => deleteDoc(requestRef!), 'Could not cancel the request. Please try again.');
        return run(askToFollow, 'Could not send the request. They may have blocked you.');
    };

    const label = isFollowing ? 'Unfollow' : !targetIsPrivate ? 'Follow' : request ? 'Requested' : 'Request to follow';

    return (
        <Button onClick={handleClick} disabled={isSubmitting} variant={isFollowing || request ? 'secondary' : 'default'}
            title={request ? 'Click to cancel your request' : undefined}>
            {isSubmitting ? '...' : label}
        </Button>
    );
}
