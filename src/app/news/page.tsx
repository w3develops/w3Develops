
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rss, Megaphone, Info, AlertTriangle, CheckCircle2, History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { GlobalAnnouncement } from '@/lib/types';
import { formatTimestamp, timeAgo } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Post {
  title: string;
  link: string;
  isoDate: string;
  source: string;
}

function formatDate(dateString: string) {
    if (!dateString) return 'No date';
    try {
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(dateString));
    } catch {
        return dateString;
    }
}

function AnnouncementItem({ announcement }: { announcement: GlobalAnnouncement }) {
    const isOngoing = announcement.startTime.toMillis() <= Date.now() && announcement.endTime.toMillis() >= Date.now();
    
    const icons = {
        info: <Info className="h-5 w-5 text-primary" />,
        warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
        success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        alert: <Megaphone className="h-5 w-5 text-destructive" />,
    };

    return (
        <div className="border-l-4 border-primary pl-4 py-2 space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icons[announcement.type]}
                    <h4 className="font-bold text-lg">{announcement.title}</h4>
                </div>
                {isOngoing && <Badge>Live Now</Badge>}
            </div>
            <p className="text-muted-foreground">{announcement.message}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>{formatTimestamp(announcement.startTime, true)} - {formatTimestamp(announcement.endTime, true)}</span>
                {announcement.link && (
                    <Link href={announcement.link} className="text-primary underline hover:opacity-80">
                        View Details
                    </Link>
                )}
            </div>
        </div>
    );
}

export default function NewsPage() {
    const firestore = useFirestore();
    const [newsItems, setNewsItems] = useState<Post[]>([]);
    const [isLoadingNews, setIsLoadingNews] = useState(true);

    const announcementsQuery = useMemo(() => {
        return query(
            collection(firestore, 'announcements'),
            orderBy('createdAt', 'desc'),
            limit(10)
        );
    }, [firestore]);

    const { data: announcements, isLoading: isLoadingAnnouncements } = useCollection<GlobalAnnouncement>(announcementsQuery);

    useEffect(() => {
      const fetchNews = async () => {
        try {
          setIsLoadingNews(true);
          const res = await fetch('/api/news');
          if (!res.ok) {
            throw new Error('Failed to fetch news');
          }
          const data: Post[] = await res.json();
          setNewsItems(data);
        } catch (error) {
          console.error("Error fetching news:", error);
        } finally {
          setIsLoadingNews(false);
        }
      };
      fetchNews();
    }, []);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-10">
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main News Content */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="font-headline text-3xl flex items-center gap-3">
                                        <Rss className="h-8 w-8" />
                                        Latest News
                                    </CardTitle>
                                    <CardDescription>
                                        Posts from the last 3 days, updated twice daily.
                                    </CardDescription>
                                </div>
                                <Button asChild variant="link">
                                   <Link href="/news/archive">View Archive</Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingNews ? (
                                <div className="text-center py-12">
                                    <h3 className="text-xl font-semibold">Fetching latest articles...</h3>
                                    <p className="text-muted-foreground mt-2">
                                        This may take a moment.
                                    </p>
                                </div>
                            ) : newsItems.length > 0 ? (
                                <div className="space-y-6">
                                    {newsItems.map((item, index) => (
                                        <div key={`${item.link}-${index}`} className="border-b pb-6 last:border-b-0 last:pb-0">
                                            <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">{item.source}</p>
                                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="block text-xl font-semibold hover:text-primary mt-1">
                                                {item.title}
                                            </a>
                                             <p className="text-sm text-muted-foreground mt-2">
                                                {formatDate(item.isoDate)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                 <div className="text-center py-12">
                                    <h3 className="text-xl font-semibold">No Recent News Found</h3>
                                    <p className="text-muted-foreground mt-2">
                                        We couldn't find any articles from the last 3 days. Please check back later.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Status & Announcements */}
                <div className="space-y-8">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-primary" />
                                Community Status
                            </CardTitle>
                            <CardDescription>
                                Official updates and current activities.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isLoadingAnnouncements ? (
                                <p className="text-center py-4 text-muted-foreground animate-pulse">Loading status...</p>
                            ) : announcements && announcements.length > 0 ? (
                                <div className="space-y-6">
                                    {announcements.map(announcement => (
                                        <AnnouncementItem key={announcement.id} announcement={announcement} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No recent announcements.</p>
                                </div>
                            )}
                            
                            <div className="pt-4 border-t">
                                <h4 className="text-sm font-semibold mb-2">Connect with us</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button asChild variant="outline" size="sm" className="w-full">
                                        <Link href="/chat">Discord</Link>
                                    </Button>
                                    <Button asChild variant="outline" size="sm" className="w-full">
                                        <Link href="https://x.com/w3develops" target="_blank">Twitter</Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
