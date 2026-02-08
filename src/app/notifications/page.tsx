
'use client';

import { useUser, useFirestore, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useTransition } from 'react';
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { doc, DocumentReference, updateDoc } from 'firebase/firestore';
import { NotificationSettings, UserProfile } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

const notificationOptions: { id: keyof NotificationSettings, label: string, description: string }[] = [
    { id: 'dailyCodingNewsletter', label: 'Daily Coding Newsletter', description: 'Get a daily dose of coding challenges and insights.' },
    { id: 'dailyJsNewsletter', label: 'Daily JS Newsletter', description: 'Stay updated with the latest in the JavaScript world.' },
    { id: 'weeklyBookClub', label: 'Weekly Book Club', description: 'Receive updates and reminders for our community book club.' },
    { id: 'tipsAndTricks', label: 'Tips and Tricks', description: 'Learn new tips and tricks to improve your coding skills.' },
    { id: 'interviewQuestions', label: 'Interview Questions', description: 'Get regular interview questions to practice for your next job.' },
    { id: 'weeklyDigest', label: 'Weekly Digest', description: 'A weekly summary of the most important happenings in the community.' },
    { id: 'surveys', label: 'Surveys', description: 'Participate in surveys to help us improve the community.' },
];

function NotificationToggle({ id: optionId, label, description }: { id: keyof NotificationSettings, label: string, description: string }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
    }, [user, firestore]);

    const { data: userProfile, isLoading } = useDoc<UserProfile>(userDocRef);
    const isEnabled = userProfile?.notificationSettings?.[optionId] || false;

    const handleToggle = (newState: boolean) => {
        if (!user || !userDocRef) {
            toast({ variant: 'destructive', title: 'Authentication Required' });
            return;
        }

        startTransition(async () => {
            try {
                await updateDoc(userDocRef, {
                    [`notificationSettings.${optionId}`]: newState
                });
                toast({ title: 'Settings Updated', description: `You will ${newState ? 'now' : 'no longer'} receive the ${label}.` });
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
            }
        });
    };

    if (isLoading) {
        return (
             <div className="flex items-center justify-between rounded-lg border p-4 animate-pulse">
                <div className="space-y-1.5">
                  <div className="h-5 w-48 bg-muted rounded"></div>
                  <div className="h-4 w-64 bg-muted rounded"></div>
                </div>
                <div className="h-6 w-11 bg-muted rounded-full"></div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
                <Label htmlFor={`switch-${optionId}`} className="text-base font-medium">{label}</Label>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Switch
                id={`switch-${optionId}`}
                checked={isEnabled}
                onCheckedChange={handleToggle}
                disabled={isPending}
            />
        </div>
    )
}


export default function NotificationSettingsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login?redirect=/notifications');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return (
            <div className="p-4 md:p-10">
                <LoadingSkeleton />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>Manage how you receive notifications and newsletters from w3Develops.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-4">
                    {notificationOptions.map(option => (
                        <NotificationToggle key={option.id} {...option} />
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
