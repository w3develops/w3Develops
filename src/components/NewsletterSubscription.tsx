
'use client';

import { useTransition, useMemo } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, DocumentReference } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

export default function NewsletterSubscription() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
    }, [user, firestore]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const handleManageSettings = () => {
        router.push('/notifications');
    };
    
    if (isUserLoading || isProfileLoading) {
      return (
        <div className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
            <div className="h-5 w-48 bg-muted rounded"></div>
            <div className="h-10 w-24 bg-muted rounded-md"></div>
        </div>
      )
    }

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
                <Label className="font-medium">Manage Notifications</Label>
                <p className="text-sm text-muted-foreground">Choose which emails you want to receive.</p>
            </div>
            <Button onClick={handleManageSettings}>
              Manage
            </Button>
        </div>
    );
}
