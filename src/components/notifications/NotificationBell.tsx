'use client';

import { useNotifications } from '@/firebase/firestore/use-notifications';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
    const { user } = useUser();
    const router = useRouter();
    const unreadCount = useNotifications();

    const handleBellClick = () => {
        if (!user) {
            router.push('/login?redirect=/account/notifications');
            return;
        }
        router.push('/account/notifications');
    };

    return (
        <Button variant="ghost" size="icon" onClick={handleBellClick} className="relative text-white hover:text-white/80">
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
                <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive flex items-center justify-center text-xs text-destructive-foreground">
                    {unreadCount}
                </div>
            )}
            <span className="sr-only">View notifications</span>
        </Button>
    );
}
