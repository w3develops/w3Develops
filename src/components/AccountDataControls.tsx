'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, deleteDoc, doc, getDoc, getDocs, query, where, writeBatch, type Firestore } from 'firebase/firestore';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, type User } from 'firebase/auth';
import { useFirestore } from '@/firebase';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { makeProvider } from '@/components/SocialSignInButtons';
import { getErrorCode } from '@/lib/utils';

const REQUEST_COLLECTIONS = ['mentorshipRequests', 'tutorRequests', 'pairRequests'];

async function docsWhere(firestore: Firestore, collectionName: string, field: string, uid: string) {
    const snapshot = await getDocs(query(collection(firestore, collectionName), where(field, '==', uid)));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Gathers everything tied to the member that their own account is allowed to read
async function collectUserData(firestore: Firestore, user: User) {
    const profile = await getDoc(doc(firestore, 'users', user.uid));
    const notifications = await getDocs(collection(firestore, 'users', user.uid, 'notifications'));
    const feed = await getDocs(collection(firestore, 'users', user.uid, 'feed'));
    const notificationPrefs = await getDoc(doc(firestore, 'users', user.uid, 'private', 'notificationPrefs'));
    const requests: Record<string, unknown[]> = {};
    for (const name of REQUEST_COLLECTIONS) {
        requests[name] = [
            ...await docsWhere(firestore, name, 'fromUid', user.uid),
            ...await docsWhere(firestore, name, 'toUid', user.uid),
        ];
    }

    return {
        exportedAt: new Date().toISOString(),
        account: { uid: user.uid, email: user.email, createdAt: user.metadata.creationTime },
        profile: profile.exists() ? profile.data() : null,
        notifications: notifications.docs.map(d => ({ id: d.id, ...d.data() })),
        activityFeed: feed.docs.map(d => ({ id: d.id, ...d.data() })),
        notificationSettings: notificationPrefs.exists() ? notificationPrefs.data() : null,
        soloProjects: await docsWhere(firestore, 'soloProjects', 'userId', user.uid),
        careerApplications: await docsWhere(firestore, 'careerApplications', 'userId', user.uid),
        ...requests,
    };
}

export default function AccountDataControls({ user }: { user: User }) {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    // Members who signed up with Google or GitHub have no password to confirm with
    const hasPassword = user.providerData.some(p => p.providerId === 'password');
    const socialProviderId = user.providerData.find(p => makeProvider(p.providerId))?.providerId;

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const data = await collectUserData(firestore, user);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'w3develops-data.json';
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            toast({ variant: 'destructive', title: 'Download failed', description: 'Please try again, or email privacy@w3develops.org.' });
        } finally {
            setIsExporting(false);
        }
    };

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsDeleting(true);
        try {
            // Firebase requires a recent sign-in before deleting an account
            if (hasPassword && user.email) {
                await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
            } else if (socialProviderId) {
                await reauthenticateWithPopup(user, makeProvider(socialProviderId)!);
            }

            const profile = await getDoc(doc(firestore, 'users', user.uid));
            const username = profile.data()?.username_lowercase as string | undefined;

            // The activity feed can hold hundreds of entries, more than one
            // batch allows, so it's cleared in chunks first
            const feed = await getDocs(collection(firestore, 'users', user.uid, 'feed'));
            for (let i = 0; i < feed.docs.length; i += 400) {
                const chunk = writeBatch(firestore);
                feed.docs.slice(i, i + 400).forEach(entry => chunk.delete(entry.ref));
                await chunk.commit();
            }

            const batch = writeBatch(firestore);
            const notifications = await getDocs(collection(firestore, 'users', user.uid, 'notifications'));
            notifications.forEach(n => batch.delete(n.ref));
            const projects = await getDocs(query(collection(firestore, 'soloProjects'), where('userId', '==', user.uid)));
            projects.forEach(p => batch.delete(p.ref));
            if (username) batch.delete(doc(firestore, 'usernames', username));
            batch.delete(doc(firestore, 'users', user.uid, 'private', 'notificationPrefs'));
            await batch.commit();

            await deleteDoc(doc(firestore, 'users', user.uid));
            await deleteUser(user);

            toast({ title: 'Account deleted', description: 'Your account and profile have been removed.' });
            router.push('/');
        } catch (error) {
            const wrongPassword = getErrorCode(error) === 'auth/invalid-credential' || getErrorCode(error) === 'auth/wrong-password';
            toast({
                variant: 'destructive',
                title: 'Could not delete account',
                description: wrongPassword ? 'The password you entered is incorrect.' : 'Something went wrong. Please try again, or email privacy@w3develops.org.',
            });
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Download Your Data</CardTitle>
                    <CardDescription>
                        Get a copy of your profile, projects, notifications, activity feed and requests as a JSON file.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleExport} disabled={isExporting}>
                        {isExporting ? 'Preparing...' : 'Download My Data'}
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle>Delete Account</CardTitle>
                    <CardDescription>
                        This permanently deletes your account, profile, solo projects, notifications and activity feed. Group work you contributed
                        to stays with the group. This can't be undone, so download your data first if you want a copy.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleDelete} className="space-y-4">
                        {hasPassword && (
                            <div className="grid gap-2">
                                <Label htmlFor="delete-password">Current Password</Label>
                                <Input id="delete-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isDeleting} />
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
                            <Input id="delete-confirm" value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={isDeleting} />
                        </div>
                        <Button type="submit" variant="destructive" disabled={isDeleting || confirmation !== 'DELETE' || (hasPassword && !password)}>
                            {isDeleting ? 'Deleting...' : 'Delete My Account'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </>
    );
}
