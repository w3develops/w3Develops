'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Group } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { GROUP_KINDS, GroupKind, isFull, isOpenToJoin } from '@/lib/groups';
import { useVerifiedGuard } from '@/lib/hooks/useVerifiedGuard';

export type JoinKind = GroupKind;

export default function JoinButton({ kind, item, onJoinSuccess }: {
    kind: GroupKind;
    item: Group;
    onJoinSuccess?: (id: string) => void;
}) {
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const router = useRouter();
    const ensureVerified = useVerifiedGuard();
    const [isJoining, setIsJoining] = useState(false);
    const config = GROUP_KINDS[kind];

    if (!user) return null;

    const itemLink = `${config.path}/${item.id}`;

    if (item.memberIds.includes(user.uid)) {
        return (
            <Button variant="outline" asChild size="sm">
                <Link href={itemLink}>View {config.label}</Link>
            </Button>
        );
    }

    if (isFull(item)) {
        return <Button size="sm" disabled>{config.label} Full</Button>;
    }

    const canJoin = isOpenToJoin(item);

    const handleJoin = async () => {
        if (!canJoin) {
            toast({
                variant: "destructive",
                title: "Unable to Join",
                description: `This ${config.noun} is already in progress. You can only join ${config.noun}s marked as 'New'.`,
                duration: 6000,
            });
            return;
        }
        if (!ensureVerified()) return;

        setIsJoining(true);
        try {
            // The group's member list is the only record of who's in it
            await updateDoc(doc(firestore, config.collection, item.id), { memberIds: arrayUnion(user.uid) });
            toast({ title: 'Success!', description: `You've joined the ${config.noun}: ${item.name}` });
            if (onJoinSuccess) {
                onJoinSuccess(item.id);
            } else {
                router.push(itemLink);
            }
        } catch {
            toast({ variant: 'destructive', title: 'Could Not Join', description: `This ${config.noun} may have just filled up or closed. Please refresh and try again.` });
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <Button onClick={handleJoin} disabled={isJoining || !canJoin} size="sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            {isJoining ? 'Joining...' : `Join ${config.label}`}
        </Button>
    );
}
