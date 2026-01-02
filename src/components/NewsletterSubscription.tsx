'use client';

import { useTransition, useMemo } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, DocumentReference } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function NewsletterSubscription() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [isPending, startTransition] = useTransition();

    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
    }, [user, firestore]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const isSubscribed = userProfile?.isSubscribedToNewsletter || false;

    const handleToggleSubscription = (newSubscriptionState: boolean) => {
        if (!user || !userDocRef) {
            toast({
                variant: 'destructive',
                title: 'Authentication Required',
                description: 'You must be logged in to manage your subscription.',
            });
            return;
        }

        startTransition(async () => {
            try {
                await updateDoc(userDocRef, {
                    isSubscribedToNewsletter: newSubscriptionState
                });

                toast({
                    title: 'Success!',
                    description: newSubscriptionState
                        ? "You have successfully subscribed to the newsletter."
                        : "You have unsubscribed from the newsletter.",
                });

            } catch (error: any) {
                 toast({
                    variant: 'destructive',
                    title: 'Update Failed',
                    description: error.message || 'An unknown error occurred. Please check your connection and security rules.',
                });
            }
        });
    };
    
    if (isUserLoading || isProfileLoading) {
      return (
        <div className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
            <div className="h-5 w-48 bg-muted rounded"></div>
            <div className="h-6 w-11 bg-muted rounded-full"></div>
        </div>
      )
    }

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
                <Label htmlFor="newsletter-switch" className="font-medium">Receive w3Develops Newsletter</Label>
                <p className="text-sm text-muted-foreground">Get the latest news, articles, and resources.</p>
            </div>
            <Switch
                id="newsletter-switch"
                checked={isSubscribed}
                onCheckedChange={handleToggleSubscription}
                disabled={isPending}
            />
        </div>
    );
}
