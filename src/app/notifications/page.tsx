'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, setDoc, type DocumentReference } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import { useToast } from '@/components/ui/use-toast';
import { NOTIFICATION_PREFS, prefIsOn, type NotificationPrefId, type NotificationPrefs } from '@/lib/notification-prefs';

/** Which notifications the member gets in their bell */
export default function NotificationSettingsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [saving, setSaving] = useState<NotificationPrefId | null>(null);

    useEffect(() => {
        if (!isUserLoading && !user) router.push('/login?redirect=/notifications');
    }, [user, isUserLoading, router]);

    const prefsRef = useMemo(
        () => user ? doc(firestore, 'users', user.uid, 'private', 'notificationPrefs') as DocumentReference<NotificationPrefs> : null,
        [user, firestore],
    );
    const { data: prefs, isLoading } = useDoc<NotificationPrefs>(prefsRef);

    const toggle = async (id: NotificationPrefId, on: boolean) => {
        if (!prefsRef) return;
        setSaving(id);
        try {
            await setDoc(prefsRef, { [id]: on }, { merge: true });
        } catch {
            toast({ variant: 'destructive', title: "Couldn't save that setting", description: 'Please try again.' });
        } finally {
            setSaving(null);
        }
    };

    if (isUserLoading || !user) {
        return <div className="p-4 md:p-10"><LoadingSkeleton /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <CardTitle as="h1">Notification Settings</CardTitle>
                    <CardDescription>
                        Choose what shows up in your <Link href="/account/notifications" className="underline">notification bell</Link>.
                        Everything still appears in the activity feed on your account page. Only you can see these settings.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {NOTIFICATION_PREFS.map(pref => (
                        <div key={pref.id} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor={`pref-${pref.id}`} className="text-base font-medium">{pref.label}</Label>
                                <p className="text-sm text-muted-foreground">{pref.description}</p>
                            </div>
                            {isLoading ? (
                                <div className="h-6 w-11 shrink-0 rounded-full bg-muted animate-pulse" />
                            ) : (
                                <Switch
                                    id={`pref-${pref.id}`}
                                    checked={prefIsOn(prefs, pref.id)}
                                    onCheckedChange={on => toggle(pref.id, on)}
                                    disabled={saving === pref.id}
                                />
                            )}
                        </div>
                    ))}
                    <p className="text-sm text-muted-foreground">
                        Email newsletters aren&apos;t sent yet. When they are, you&apos;ll be able to choose them here too.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
