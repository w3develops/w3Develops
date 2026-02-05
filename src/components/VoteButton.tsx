'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { arrayUnion, arrayRemove, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { CompetitionEntry } from '@/lib/types';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface VoteButtonProps {
  entry: CompetitionEntry;
  competitionId: string;
  canVote: boolean;
}

export default function VoteButton({ entry, competitionId, canVote }: VoteButtonProps) {
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!user || !firestore) {
        return (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-5 w-5" />
                <span>{entry.voterIds?.length || 0}</span>
            </div>
        );
    }
    
    if (user.uid === entry.userId) {
        return (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-5 w-5" />
                <span>{entry.voterIds?.length || 0}</span>
            </div>
        );
    }

    const isVoted = entry.voterIds?.includes(user.uid);

    const handleVoteToggle = async () => {
        setIsSubmitting(true);
        const entryRef = doc(firestore, 'competitions', competitionId, 'entries', entry.id);

        const updateData = {
            voterIds: isVoted ? arrayRemove(user.uid) : arrayUnion(user.uid)
        };

        try {
            await updateDoc(entryRef, updateData);
        } catch (error: any) {
            console.error("Vote Error: ", error);
             const permissionError = new FirestorePermissionError({
                path: entryRef.path,
                operation: 'update',
                requestResourceData: { voterId: user.uid, action: isVoted ? 'remove' : 'add' }
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not cast vote due to a permission issue.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!canVote) {
        return (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className={cn("h-5 w-5", isVoted && 'fill-primary text-primary')} />
                <span>{entry.voterIds?.length || 0}</span>
            </div>
        );
    }

    return (
        <Button onClick={handleVoteToggle} disabled={isSubmitting} variant="ghost" size="sm" className="flex items-center gap-1">
            <Star className={cn("h-5 w-5", isVoted ? 'fill-primary text-primary' : 'text-muted-foreground')} />
            <span>{entry.voterIds?.length || 0}</span>
        </Button>
    );
}
