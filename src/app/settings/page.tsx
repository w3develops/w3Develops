'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";

export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login?redirect=/settings');
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
                </CardContent>
            </Card>
        </div>
    );
}
