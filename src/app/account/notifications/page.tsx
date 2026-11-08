'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, doc, limit, orderBy, query, updateDoc, where, writeBatch, type Query } from 'firebase/firestore';
import { BellRing, Check, CheckCheck } from 'lucide-react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useNow } from '@/lib/hooks/useClientValues';
import { timeAgo } from '@/lib/utils';
import type { FeedEntry } from '@/lib/types';

const SHOWN = 50;

function NotificationItem({ entry, now, onToggleRead }: { entry: FeedEntry; now: number | null; onToggleRead: (entry: FeedEntry) => void }) {
    return (
        <div className="flex items-start gap-4 p-4 hover:bg-accent/50">
            <div className={`mt-4 h-2 w-2 rounded-full flex-shrink-0 ${entry.read ? 'bg-transparent' : 'bg-primary'}`} aria-hidden="true" />
            <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarImage src={entry.actorPhoto || undefined} alt="" />
                <AvatarFallback>{entry.actorName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Link
                href={entry.link || '#'}
                className="flex-1 space-y-1"
                onClick={() => { if (!entry.read) onToggleRead(entry); }}
            >
                <p className={`font-medium ${entry.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {!entry.read && <span className="sr-only">Unread: </span>}{entry.message}
                </p>
                {entry.detail && <p className="text-sm text-muted-foreground italic break-words">&quot;{entry.detail}&quot;</p>}
                {/* Relative times depend on the clock, so they're filled in by the browser */}
                <p className="text-sm text-muted-foreground">{now === null ? ' ' : timeAgo(entry.createdAt, now)}</p>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => onToggleRead(entry)}>
                {entry.read ? <BellRing className="w-5 h-5 text-muted-foreground" /> : <Check className="w-5 h-5 text-primary" />}
                <span className="sr-only">{entry.read ? 'Mark as unread' : 'Mark as read'}</span>
            </Button>
        </div>
    );
}

/** The member's notifications: the entries in their feed meant for the bell */
export default function NotificationsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const now = useNow();
    const [isMarkingAll, setIsMarkingAll] = useState(false);

    useEffect(() => {
        if (!isUserLoading && !user) router.push('/login?redirect=/account/notifications');
    }, [user, isUserLoading, router]);

    const notificationsQuery = useMemo(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'users', user.uid, 'feed'),
            where('notify', '==', true),
            orderBy('createdAt', 'desc'),
            limit(SHOWN),
        ) as Query<FeedEntry>;
    }, [user, firestore]);

    const { data: entries, isLoading } = useCollection<FeedEntry>(notificationsQuery);
    const unread = (entries ?? []).filter(entry => !entry.read);

    const toggleRead = (entry: FeedEntry) => {
        if (!user) return;
        updateDoc(doc(firestore, 'users', user.uid, 'feed', entry.id), { read: !entry.read })
            .catch(() => toast({ variant: 'destructive', title: "Couldn't update that notification", description: 'Please try again.' }));
    };

    const markAllRead = async () => {
        if (!user || unread.length === 0) return;
        setIsMarkingAll(true);
        try {
            const batch = writeBatch(firestore);
            unread.forEach(entry => batch.update(doc(firestore, 'users', user.uid, 'feed', entry.id), { read: true }));
            await batch.commit();
        } catch {
            toast({ variant: 'destructive', title: "Couldn't mark them read", description: 'Please try again.' });
        } finally {
            setIsMarkingAll(false);
        }
    };

    if (isUserLoading || !user) {
        return <div className="p-4 md:p-10"><LoadingSkeleton /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                    <div className="space-y-1.5">
                        <CardTitle as="h1">Notifications</CardTitle>
                        <CardDescription>
                            Follows, and what&apos;s happening in your groups. Notifications are kept for 60 days.
                        </CardDescription>
                    </div>
                    {unread.length > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllRead} disabled={isMarkingAll}>
                            <CheckCheck className="w-4 h-4 mr-2" aria-hidden="true" /> Mark all read
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="divide-y">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="p-4 space-y-2 animate-pulse">
                                    <div className="h-4 bg-muted rounded w-3/4" />
                                    <div className="h-3 bg-muted rounded w-1/4" />
                                </div>
                            ))}
                        </div>
                    ) : entries && entries.length > 0 ? (
                        <div className="divide-y">
                            {entries.map(entry => <NotificationItem key={entry.id} entry={entry} now={now} onToggleRead={toggleRead} />)}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            <BellRing className="w-12 h-12 mx-auto mb-4" aria-hidden="true" />
                            <h2 className="font-semibold">No notifications yet</h2>
                            <p>We&apos;ll let you know when someone follows you, or when your groups get new members, check-ins or tasks.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
