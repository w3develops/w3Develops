
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, Timestamp, orderBy, limit } from 'firebase/firestore';
import { GlobalAnnouncement } from '@/lib/types';
import { Megaphone, Info, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const typeStyles = {
  info: "bg-primary text-primary-foreground",
  warning: "bg-yellow-500 text-white",
  success: "bg-green-600 text-white",
  alert: "bg-destructive text-destructive-foreground",
};

const typeIcons = {
  info: <Info className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  success: <CheckCircle2 className="h-5 w-5" />,
  alert: <Megaphone className="h-5 w-5" />,
};

export default function AnnouncementBanner() {
  const firestore = useFirestore();
  const [isVisible, setIsVisible] = useState(true);
  const [now, setNow] = useState<Timestamp>(Timestamp.now());

  // Update 'now' every minute to handle time-based expiration
  useEffect(() => {
    const timer = setInterval(() => setNow(Timestamp.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const activeAnnouncementsQuery = useMemo(() => {
    return query(
      collection(firestore, 'announcements'),
      where('isActive', '==', true),
      where('endTime', '>', now),
      orderBy('endTime', 'asc'),
      limit(1)
    );
  }, [firestore, now]);

  const { data: announcements, isLoading } = useCollection<GlobalAnnouncement>(activeAnnouncementsQuery);

  const activeAnnouncement = useMemo(() => {
    if (!announcements || announcements.length === 0) return null;
    const item = announcements[0];
    // Double check start time on client
    if (item.startTime.toMillis() > now.toMillis()) return null;
    return item;
  }, [announcements, now]);

  if (isLoading || !activeAnnouncement || !isVisible) {
    return null;
  }

  return (
    <div className={cn(
      "relative flex items-center justify-center px-4 py-2 text-sm font-medium transition-all animate-in slide-in-from-top duration-500",
      typeStyles[activeAnnouncement.type]
    )}>
      <div className="flex items-center gap-3 max-w-4xl mx-auto">
        {typeIcons[activeAnnouncement.type]}
        <div className="flex-1 text-center">
          <span className="font-bold mr-2">{activeAnnouncement.title}:</span>
          <span>{activeAnnouncement.message}</span>
          {activeAnnouncement.link && (
            <Link href={activeAnnouncement.link} className="ml-2 underline hover:opacity-80">
              Learn more &rarr;
            </Link>
          )}
        </div>
      </div>
      <button 
        onClick={() => setIsVisible(false)} 
        className="absolute right-2 p-1 hover:bg-black/10 rounded-full"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
