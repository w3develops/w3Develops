'use client';

import { useCollection, useUser, useFirestore } from '@/firebase';
import { useMemo, useEffect } from 'react';
import { collection, query, orderBy, Query, updateDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Notification } from '@/lib/types';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/utils';
import { BellRing, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

function NotificationItem({ notification, onToggleRead }: { notification: Notification, onToggleRead: (id: string, currentState: boolean) => void }) {
    return (
        <div className="flex items-start gap-4 p-4 border-b last:border-b-0 hover:bg-accent/50">
            <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!notification.isRead ? 'bg-primary' : 'bg-transparent'}`}></div>
            <Link href={notification.link || '#'} className="flex-1 space-y-1">
                <p className={`font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{notification.message}</p>
                <p className="text-sm text-muted-foreground">{formatTimestamp(notification.createdAt, true)}</p>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => onToggleRead(notification.id, notification.isRead)}>
                {notification.isRead ? <BellRing className="w-5 h-5 text-muted-foreground" /> : <Check className="w-5 h-5 text-primary" />}
                <span className="sr-only">{notification.isRead ? 'Mark as unread' : 'Mark as read'}</span>
            </Button>
        </div>
    )
}

export default function NotificationsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login?redirect=/account/notifications');
        }
    }, [user, isUserLoading, router]);

    const notificationsQuery = useMemo(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'users', user.uid, 'notifications'),
            orderBy('createdAt', 'desc')
        ) as Query<Notification>;
    }, [user, firestore]);

    const { data: notifications, isLoading: isNotificationsLoading } = useCollection<Notification>(notificationsQuery);
    
    const handleToggleRead = async (notificationId: string, currentState: boolean) => {
        if (!user) return;
        const notificationRef = doc(firestore, 'users', user.uid, 'notifications', notificationId);
        const updateData = { isRead: !currentState };

        updateDoc(notificationRef, updateData)
            .catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                    path: notificationRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not update notification status due to a permission issue.'
                });
            });
    };


    if (isUserLoading || !user) {
        return (
            <div className="p-4 md:p-10">
                <LoadingSkeleton />
            </div>
        );
    }
    
     if (isNotificationsLoading) {
         return (
            <div className="max-w-3xl mx-auto p-4 md:p-10">
                 <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Your recent updates and alerts.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="p-4 space-y-2 animate-pulse">
                                    <div className="h-4 bg-muted rounded w-3/4"></div>
                                    <div className="h-3 bg-muted rounded w-1/4"></div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Your recent updates and alerts.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {notifications && notifications.length > 0 ? (
                        <div className="divide-y">
                            {notifications.map(notif => (
                                <NotificationItem key={notif.id} notification={notif} onToggleRead={handleToggleRead} />
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            <BellRing className="w-12 h-12 mx-auto mb-4" />
                            <h3 className="font-semibold">No notifications yet</h3>
                            <p>We'll let you know when something important happens.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
