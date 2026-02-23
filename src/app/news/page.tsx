'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rss, Megaphone, Info, AlertTriangle, CheckCircle2, History, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { GlobalAnnouncement } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import GlobalPulse from '@/components/GlobalPulse';

interface Post {
  title: string;
  link: string;
  isoDate: string;
  source: string;
}

const ITEMS_PER_PAGE = 10; // Showing 10 per page for better UX, can be set to 100 as requested

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
                    <h4 className="font-bold text-lg leading-tight">{announcement.title}</h4>
                </div>
                {isOngoing && <Badge className="shrink-0 ml-2">Live</Badge>}
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{announcement.message}</p>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 uppercase tracking-wider">
                <span>{formatTimestamp(announcement.startTime, true)}</span>
                {announcement.link && (
                    <Link href={announcement.link} className="text-primary font-bold hover:underline">
                        Details
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
    const [currentPage, setCurrentPage] = useState(1);

    const announcementsQuery = useMemo(() => {
        return query(
            collection(firestore, 'announcements'),
            orderBy('createdAt', 'desc'),
            limit(5)
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

    // Pagination Logic
    const totalPages = Math.ceil(newsItems.length / ITEMS_PER_PAGE);
    const paginatedNews = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return newsItems.slice(start, start + ITEMS_PER_PAGE);
    }, [newsItems, currentPage]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main News Content */}
                <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
                    <Card className="border-none shadow-none bg-transparent">
                        <CardHeader className="px-0 pt-0">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div>
                                    <CardTitle className="font-headline text-3xl flex items-center gap-3">
                                        <Rss className="h-8 w-8 text-primary" />
                                        Latest News
                                    </CardTitle>
                                    <CardDescription>
                                        Aggregated posts from the developer ecosystem, updated daily.
                                    </CardDescription>
                                </div>
                                <Button asChild variant="outline" size="sm" className="w-fit">
                                   <Link href="/news/archive">View Archive</Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0">
                            {isLoadingNews ? (
                                <div className="space-y-8 animate-pulse py-4">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="space-y-3">
                                            <div className="h-4 bg-muted rounded w-24"></div>
                                            <div className="h-6 bg-muted rounded w-3/4"></div>
                                            <div className="h-4 bg-muted rounded w-32"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : newsItems.length > 0 ? (
                                <>
                                    <div className="space-y-8">
                                        {paginatedNews.map((item, index) => (
                                            <Card key={`${item.link}-${index}`} className="hover:shadow-md transition-shadow">
                                                <CardContent className="p-6">
                                                    <p className="text-xs text-primary font-bold uppercase tracking-widest">{item.source}</p>
                                                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="block text-xl md:text-2xl font-bold font-headline group-hover:text-primary transition-colors mt-2 leading-tight">
                                                        {item.title}
                                                    </a>
                                                    <p className="text-sm text-muted-foreground mt-3">
                                                        {formatDate(item.isoDate)}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-4 mt-12 pt-8 border-t">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="gap-2"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                Previous
                                            </Button>
                                            
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                            </div>

                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="gap-2"
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                 <div className="text-center py-16 border-2 border-dashed rounded-xl bg-card">
                                    <Rss className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <h3 className="text-xl font-semibold">No Recent News Found</h3>
                                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto px-4">
                                        We couldn't find any articles from the last 3 days. Our bots are searching for fresh content!
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Status & Pulse */}
                <div className="space-y-8 order-1 lg:order-2">
                    <Card className="lg:sticky lg:top-24 border-2 border-primary/10">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Megaphone className="h-5 w-5 text-primary" />
                                Community Status
                            </CardTitle>
                            <CardDescription>
                                Official updates from w3Develops HQ.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Manual Announcements */}
                            <div className="space-y-6">
                                {isLoadingAnnouncements ? (
                                    <div className="space-y-4">
                                        {[...Array(2)].map((_, i) => (
                                            <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                                        ))}
                                    </div>
                                ) : announcements && announcements.length > 0 ? (
                                    announcements.map(announcement => (
                                        <AnnouncementItem key={announcement.id} announcement={announcement} />
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No recent announcements.</p>
                                    </div>
                                )}
                            </div>

                            {/* Automated Pulse */}
                            <div className="pt-6 border-t border-border/50">
                                <GlobalPulse />
                            </div>
                            
                            {/* Social Connect */}
                            <div className="pt-6 border-t border-border/50">
                                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <Share2 className="h-4 w-4 text-primary" />
                                    Stay Connected
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button asChild variant="secondary" size="sm" className="w-full font-bold">
                                        <Link href="/chat">Discord</Link>
                                    </Button>
                                    <Button asChild variant="secondary" size="sm" className="w-full font-bold">
                                        <Link href="https://x.com/w3develops" target="_blank">Twitter / X</Link>
                                    </Button>
                                    <Button asChild variant="outline" size="sm" className="col-span-2 font-bold">
                                        <Link href="/newsletter">Community Newsletter</Link>
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
