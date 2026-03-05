
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rss, Megaphone, Info, AlertTriangle, CheckCircle2, History, ChevronLeft, ChevronRight, Twitter, Youtube, ExternalLink, Facebook, Linkedin, Instagram, Heart, Share2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { GlobalAnnouncement, UserProfile } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import GlobalPulse from '@/components/GlobalPulse';
import AiNewsSummary from '@/components/AiNewsSummary';
import { useToast } from '@/components/ui/use-toast';

interface Post {
  title: string;
  link: string;
  isoDate: string;
  source: string;
}

const ITEMS_PER_PAGE = 25;

const MastodonIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.193 7.879c0-5.206-3.411-6.732-3.411-6.732C18.062.357 15.108.025 12.041 0h-.076c-3.068.025-6.02.357-7.74 1.147 0 0-3.411 1.526-3.411 6.732 0 1.192-.023 2.618.015 4.129.124 5.092.934 10.109 5.641 11.355 2.17.574 4.034.694 5.535.612 2.722-.147 4.256-.9 4.256-.9l-.083-1.751s-1.909.549-4.248.48c-2.326-.074-4.805-.272-5.19-3.058-.04-.285-.041-.59-.033-.9 1.971.479 3.912.596 5.699.51 1.777-.086 3.584-.342 5.39-.735 3.191-.695 4.465-2.312 4.465-2.312.093-1.508.059-2.997.059-4.188zm-4.319 9.74h-2.428V9.255c0-1.281-.519-1.93-1.557-1.93-.864 0-1.484.59-1.861 1.771L12 10.829l-1.028-1.733c-.377-1.181-.997-1.771-1.861-1.771-1.038 0-1.557.65-1.557 1.93v8.364H5.126V9.149c0-2.428 1.556-3.624 3.557-3.624 1.162 0 2.056.445 2.688 1.312L12 7.829l.629-1.002c.632-.867 1.526-1.312 2.688-1.312 2.001 0 3.557 1.196 3.557 3.624v8.47z"/>
  </svg>
);

const BlueskyIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C3.405 1.447 1.457 1.62 1.457 3.412c0 1.501.97 5.56 1.457 7.027.652 1.965 2.143 2.436 4.003 2.236-1.859.2-3.351-.271-4.003-2.236-.487-1.467-1.457-5.526-1.457-7.027 0-1.792 1.948-1.965 3.745-.592 2.752 1.942 5.711 5.881 6.798 7.995 1.087-2.114 4.046-6.053 6.798-7.995 1.797-1.373 3.745-1.2 3.745.592 0 1.501-.97 5.56-1.456 7.027-.652 1.965-2.144 2.436-4.003 2.236 1.859.2 3.351-.271 4.003-2.236.487-1.467 1.457-5.526 1.457-7.027 0-1.792-1.948-1.965-3.745-.592-2.752 1.942-5.711 5.881-6.798 7.995zM12 13.2c-1.087 2.114-4.046 6.053-6.798 7.995-1.797 1.373-3.745 1.2-3.745-.592 0-1.501.97-5.56 1.457-7.027.652-1.965 2.143-2.436 4.003-2.236-1.859-.2-3.351.271-4.003 2.236-.487 1.467-1.457-5.526-1.457 7.027 0 1.792 1.948 1.965 3.745.592 2.752-1.942 5.711-5.881 6.798-7.995 1.087 2.114 4.046 6.053 6.798 7.995 1.797 1.373 3.745 1.2 3.745-.592 0-1.501-.97-5.56 1.457-7.027.652-1.965-2.144-2.436-4.003-2.236 1.859-.2 3.351.271 4.003 2.236.487-1.467 1.457-5.526 1.457 7.027 0 1.792-1.948 1.965-3.745.592-2.752-1.942-5.711-5.881-6.798-7.995z"/>
  </svg>
);

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

function NewsItem({ item, user, userProfile }: { item: Post, user: any, userProfile: UserProfile | null }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const isHearted = userProfile?.starredSoloProjectIds?.includes(item.link) || false; // Reusing starred list for hearts for MVP

    const handleHeart = async () => {
        if (!user) {
            toast({ title: "Sign in to heart articles", variant: "destructive" });
            return;
        }
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
            starredSoloProjectIds: isHearted ? arrayRemove(item.link) : arrayUnion(item.link)
        });
    };

    const handleShare = () => {
        const text = `Check out this article from w3Develops: ${item.title}`;
        const url = item.link;
        if (navigator.share) {
            navigator.share({ title: item.title, text, url });
        } else {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        }
    };

    return (
        <Card className="hover:shadow-md transition-all border-l-4 border-l-primary group">
            <CardContent className="p-6">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1">
                        <p className="text-xs text-primary font-bold uppercase tracking-widest">{item.source}</p>
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="block text-xl md:text-2xl font-bold font-headline hover:text-primary transition-colors leading-tight">
                            {item.title}
                        </a>
                        <p className="text-sm text-muted-foreground">
                            {formatDate(item.isoDate)}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button variant="ghost" size="icon" onClick={handleHeart} className={isHearted ? 'text-red-500' : 'text-muted-foreground'}>
                            <Heart className={`h-5 w-5 ${isHearted ? 'fill-current' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleShare} className="text-muted-foreground">
                            <Share2 className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function NewsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
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
    
    const userDocRef = useMemo(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
    const { data: userProfile } = useCollection<UserProfile>(userDocRef as any);

    useEffect(() => {
      const fetchNews = async () => {
        try {
          setIsLoadingNews(true);
          const res = await fetch('/api/news');
          if (!res.ok) throw new Error('Failed to fetch news');
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

    const totalPages = Math.ceil(newsItems.length / ITEMS_PER_PAGE);
    const paginatedNews = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return newsItems.slice(start, start + ITEMS_PER_PAGE);
    }, [newsItems, currentPage]);

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-12">
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-headline font-bold flex items-center gap-3 text-foreground">
                            <Rss className="h-10 w-10 text-primary" />
                            Latest News
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Exciting new developments from the w3Develops ecosystem and beyond.
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/news/archive">View Archive</Link>
                    </Button>
                </div>
            </div>

            {!isLoadingNews && newsItems.length > 0 && <AiNewsSummary articles={newsItems} />}

            <section className="space-y-8">
                {isLoadingNews ? (
                    <div className="space-y-8 animate-pulse">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-32 bg-muted rounded-xl"></div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {paginatedNews.map((item, index) => (
                            <NewsItem key={`${item.link}-${index}`} item={item} user={user} userProfile={userProfile as any} />
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-8 border-t">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                            <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                        </Button>
                        <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                            Next <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                )}
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t">
                <Card className="border-2 border-primary/10 h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Megaphone className="h-5 w-5 text-primary" />
                            Community Status
                        </CardTitle>
                        <CardDescription>Official announcements from w3Develops.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoadingAnnouncements ? (
                            <div className="space-y-4">
                                {[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-muted rounded animate-pulse" />)}
                            </div>
                        ) : announcements && announcements.length > 0 ? (
                            announcements.map(announcement => (
                                <div key={announcement.id} className="border-l-4 border-primary pl-4 py-2 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-lg leading-tight">{announcement.title}</h4>
                                        <Badge>{announcement.type}</Badge>
                                    </div>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{announcement.message}</p>
                                    <span className="text-[10px] text-muted-foreground pt-1 block">{formatTimestamp(announcement.startTime, true)}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-center text-muted-foreground py-4">No recent announcements.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-2 border-primary/10 h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Global Pulse
                        </CardTitle>
                        <CardDescription>Live activity from the w3Develops website.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <GlobalPulse />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
