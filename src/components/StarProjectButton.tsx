'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { arrayUnion, arrayRemove, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface StarProjectButtonProps {
    projectId: string;
    userProfile: UserProfile | null;
}

export default function StarProjectButton({ projectId, userProfile }: StarProjectButtonProps) {
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!user || !firestore || !userProfile) {
        return null;
    }

    const isStarred = userProfile.starredSoloProjectIds?.includes(projectId);

    const handleStarToggle = async () => {
        setIsSubmitting(true);
        const currentUserRef = doc(firestore, 'users', user.uid);
        const updateData = { 
            starredSoloProjectIds: isStarred ? arrayRemove(projectId) : arrayUnion(projectId) 
        };

        updateDoc(currentUserRef, updateData)
            .then(() => {
                toast({ title: isStarred ? "Project Unstarred" : "Project Starred!" });
            })
            .catch(error => {
                 const permissionError = new FirestorePermissionError({
                    path: currentUserRef.path,
                    operation: 'update',
                    requestResourceData: updateData
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
        <Button onClick={handleStarToggle} disabled={isSubmitting} variant="ghost" size="icon">
            <Star className={cn("h-5 w-5", isStarred ? 'fill-primary text-primary' : 'text-muted-foreground')} />
            <span className="sr-only">{isStarred ? 'Unstar project' : 'Star project'}</span>
        </Button>
    );
}
