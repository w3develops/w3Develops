'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useUser, useFirestore, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { doc, DocumentReference, updateDoc } from 'firebase/firestore';
import { UserProfile, MentorshipStatus } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login?redirect=/settings');
        }
    }, [user, isUserLoading, router]);

    const handleStatusChange = async (checked: boolean) => {
        if (!userDocRef) return;
        setIsSubmitting(true);
        const newStatus: MentorshipStatus = checked ? 'open' : 'closed';
        try {
            await updateDoc(userDocRef, {
                mentorshipStatus: newStatus
            });
            toast({ title: "Mentorship Status Updated", description: `You are now ${newStatus} to mentorship requests.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message || "Could not update status." });
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isUserLoading || isProfileLoading || !user) {
        return (
            <div className="p-4 md:p-10">
                <LoadingSkeleton />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-10 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Manage your account settings and preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h4 className="font-medium">Profile</h4>
                            <p className="text-sm text-muted-foreground">Update your public profile information.</p>
                        </div>
                        <Button asChild>
                            <Link href="/profile/edit">Edit Profile</Link>
                        </Button>
                   </div>
                   <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h4 className="font-medium">Security</h4>
                            <p className="text-sm text-muted-foreground">Change your password and email address.</p>
                        </div>
                        <Button asChild>
                            <Link href="/security">Manage Security</Link>
                        </Button>
                   </div>
                   <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h4 className="font-medium">Notifications</h4>
                            <p className="text-sm text-muted-foreground">Manage how you receive notifications.</p>
                        </div>
                        <Button asChild>
                            <Link href="/notifications">Manage Notifications</Link>
                        </Button>
                   </div>
                   {userProfile && userProfile.mentorshipRole !== 'none' && (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-0.5">
                                <Label htmlFor="mentorship-status" className="font-medium">Mentorship Availability</Label>
                                <p className="text-sm text-muted-foreground">Set whether you are open to new mentorship requests.</p>
                            </div>
                            <div className="flex items-center space-x-2">
                               <Switch
                                  id="mentorship-status"
                                  checked={userProfile.mentorshipStatus === 'open'}
                                  onCheckedChange={handleStatusChange}
                                  disabled={isSubmitting}
                                />
                            </div>
                        </div>
                   )}
                </CardContent>
            </Card>
        </div>
    );
}
