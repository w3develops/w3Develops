
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rss, Megaphone, Info, AlertTriangle, CheckCircle2, History, Share2, ChevronLeft, ChevronRight, MessageSquare, Twitter, Globe, Github, Youtube, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
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

const ITEMS_PER_PAGE = 50;

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

    // Social Feed Logic
    const socialPosts = useMemo(() => {
        const platforms = [
            { name: 'Mastodon', icon: <Globe className="h-4 w-4" />, color: 'bg-[#2b90d9]', patterns: ['mastodon.social'] },
            { name: 'YouTube', icon: <Youtube className="h-4 w-4" />, color: 'bg-red-600', patterns: ['YouTube', 'w3Develops'] },
            { name: 'X / Twitter', icon: <Twitter className="h-4 w-4" />, color: 'bg-black', patterns: ['x.com', 'twitter'] },
            { name: 'GitHub', icon: <Github className="h-4 w-4" />, color: 'bg-[#24292e]', patterns: ['GitHub'] },
        ];

        return platforms.map(platform => {
            const latest = newsItems.find(item => 
                platform.patterns.some(p => item.source.includes(p) || item.link.includes(p))
            );
            return { ...platform, post: latest };
        });
    }, [newsItems]);

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-12">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-headline font-bold flex items-center gap-3">
                            <Rss className="h-10 w-10 text-primary" />
                            Latest News
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Stay up to date with the developer ecosystem.
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/news/archive">View Archive</Link>
                    </Button>
                </div>
            </div>

            {/* News Feed */}
            <section className="space-y-8">
                {isLoadingNews ? (
                    <div className="space-y-8 animate-pulse">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-32 bg-muted rounded-xl"></div>
                        ))}
                    </div>
                ) : newsItems.length > 0 ? (
                    <>
                        <div className="space-y-6">
                            {paginatedNews.map((item, index) => (
                                <Card key={`${item.link}-${index}`} className="hover:shadow-md transition-all border-l-4 border-l-primary">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-2">
                                                <p className="text-xs text-primary font-bold uppercase tracking-widest">{item.source}</p>
                                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="block text-xl md:text-2xl font-bold font-headline hover:text-primary transition-colors leading-tight">
                                                    {item.title}
                                                </a>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDate(item.isoDate)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 pt-8 border-t">
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
                                <span className="text-sm font-medium">
                                    Page {currentPage} of {totalPages}
                                </span>
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
                    <div className="text-center py-16 border-2 border-dashed rounded-xl">
                        <Rss className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <h3 className="text-xl font-semibold">No Recent News Found</h3>
                        <p className="text-muted-foreground mt-2">Check back soon for fresh content!</p>
                    </div>
                )}
            </section>

            {/* Bottom Status & Community Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t">
                {/* Community Status */}
                <Card className="border-2 border-primary/10">
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
                                <AnnouncementItem key={announcement.id} announcement={announcement} />
                            ))
                        ) : (
                            <p className="text-sm text-center text-muted-foreground py-4">No recent announcements.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Community Pulse */}
                <Card className="border-2 border-primary/10">
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

            {/* Social Pulse Feed Section */}
            <section className="space-y-8 pt-12 border-t">
                <div className="text-center">
                    <h2 className="text-3xl font-bold font-headline">Latest from our Socials</h2>
                    <p className="text-muted-foreground mt-2">Real-time updates directly from our community platforms.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {socialPosts.map((platform) => (
                        <Card key={platform.name} className="flex flex-col h-full hover:shadow-lg transition-shadow border-t-4" style={{ borderTopColor: platform.post ? undefined : 'transparent' }}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-md ${platform.color} text-white`}>
                                            {platform.icon}
                                        </div>
                                        <span className="font-bold text-sm">{platform.name}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] uppercase">Live</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-between pt-0">
                                {platform.post ? (
                                    <>
                                        <div className="space-y-2">
                                            <a 
                                                href={platform.post.link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-sm font-semibold hover:text-primary transition-colors line-clamp-3 leading-snug"
                                            >
                                                {platform.post.title}
                                            </a>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                                {formatDate(platform.post.isoDate)}
                                            </p>
                                        </div>
                                        <Button asChild variant="link" size="sm" className="px-0 mt-4 h-auto justify-start">
                                            <a href={platform.post.link} target="_blank" rel="noopener noreferrer" className="gap-1">
                                                View Post <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <p className="text-xs text-muted-foreground italic">No recent posts found.</p>
                                        <Button asChild variant="link" size="sm" className="mt-2 h-auto">
                                            <Link href="/chat">Join our Discord</Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
                
                <Card className="bg-secondary/30">
                    <CardContent className="p-6 text-center">
                        <p className="text-sm italic text-muted-foreground">
                            "Stay connected. Follow us across all platforms to never miss an update!"
                        </p>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
