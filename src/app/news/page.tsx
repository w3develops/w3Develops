
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rss, Megaphone, Info, AlertTriangle, CheckCircle2, History, ChevronLeft, ChevronRight, Twitter, Youtube, ExternalLink, Facebook, Linkedin, Instagram, LayoutGrid } from "lucide-react";
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

// Custom Icons for platforms not in Lucide
const RedditIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" className={className}>
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.1 11.4c-.4.4-1.1.4-1.5 0l-.8-.8c-.1-.1-.3-.1-.4 0l-.8.8c-.4.4-1.1.4-1.5 0-.4-.4-.4-1.1 0-1.5l.8-.8c.1-.1.1-.3 0-.4l-.8-.8c-.4-.4-.4-1.1 0-1.5.4-.4 1.1-.4 1.5 0l.8.8c.1.1.3.1.4 0l.8-.8c.4-.4 1.1-.4 1.5 0 .4.4.4 1.1 0 1.5l-.8.8c-.1.1-.1.3 0 .4l.8.8c.4.4.4 1.1 0 1.5M4.4 6c0-.5.4-.9.9-.9s.9.4.9.9-.4.9-.9.9-.9-.4-.9-.9m6.3 0c0-.5.4-.9.9-.9s.9.4.9.9-.4.9-.9.9-.9-.4-.9-.9m-3.1 4.3c-1.3 0-2.3 1-2.3 2.3h4.6c0-1.3-1-2.3-2.3-2.3" />
    </svg>
);

const MastodonIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path d="M23.19,9.52c0-2.26-1.57-4.14-3.67-4.14H17.4c-0.84,0-1.58,0.48-1.95,1.23c-0.63,1.27-1.2,2.57-1.7,3.89c-0.42-0.2-0.86-0.38-1.32-0.52c-0.78-0.25-1.57-0.4-2.38-0.4c-3.95,0-7.16,3.2-7.16,7.16c0,1.38,0.4,2.67,1.09,3.77C4.7,21.68,5.82,22.03,7,22c0.88-0.02,1.72-0.34,2.44-0.9c0.58-0.45,1.07-1,1.45-1.63c0.37-0.62,0.6-1.3,0.68-2.02c0.14-1.27,0.22-2.56,0.22-3.86c0-0.6-0.03-1.2-0.08-1.79c0.69,0.25,1.38,0.52,2.05,0.82c0.91,0.4,1.78,0.85,2.59,1.34c0.8,0.48,1.52,0.99,2.15,1.53c0.8,0.67,1.4,1.48,1.77,2.39c0.11,0.28,0.21,0.57,0.3,0.86c0.09,0.3,0.16,0.6,0.22,0.9c0.07,0.37,0.11,0.74,0.11,1.12c0,0.18-0.01,0.36-0.02,0.54c-0.03,0.34-0.07,0.68-0.12,1.01c-0.05,0.34-0.11,0.68-0.18,1.01c-0.24,1.15-0.74,2.2-1.44,3.1c-0.75,0.96-1.72,1.74-2.82,2.28c-1.12,0.55-2.34,0.83-3.6,0.83c-2.45,0-4.71-0.93-6.42-2.58C2.93,19.33,2,16.8,2,14.07c0-4.99,4.04-9.03,9.03-9.03c1.3,0,2.55,0.28,3.69,0.8c1.1,0.49,2.1,1.15,2.99,1.95l0.12,0.1c0.13,0.12,0.25,0.23,0.37,0.35c0.12,0.12,0.23,0.23,0.34,0.35c0.85,0.9,1.52,1.93,1.98,3.03c0.47,1.12,0.7,2.33,0.7,3.58c0,0.52-0.06,1.03-0.17,1.53c-0.12,0.5-0.28,0.99-0.48,1.45c-0.2,0.47-0.44,0.92-0.71,1.35c-0.56,0.88-1.33,1.6-2.25,2.1c-0.9,0.5-1.92,0.78-2.98,0.78c-2.1,0-4.04-0.81-5.5-2.27c-1.46-1.46-2.27-3.4-2.27-5.5c0-1.89,0.76-3.6,2.01-4.85c1.25-1.25,2.96-2.01,4.85-2.01c0.7,0,1.38,0.1,2.04,0.29c0.65,0.19,1.29,0.44,1.9,0.73l0.36,0.17c0.23,0.11,0.46,0.22,0.68,0.33l-0.8-4.22c-0.06-0.34-0.14-0.67-0.24-0.99c-0.1-0.32-0.22-0.64-0.35-0.95C17.06,6.33,16.29,5.77,15.42,5.77h-2.1c-0.41,0-0.75,0.34-0.75,0.75s0.34,0.75,0.75,0.75h2.1c0.3,0,0.57,0.17,0.71,0.43c0.14,0.26,0.18,0.56,0.13,0.85l1.03,5.43c-0.74-0.48-1.53-0.92-2.36-1.3c-0.84-0.38-1.7-0.72-2.59-0.99c-1.41-0.43-2.88-0.65-4.38-0.65C6.83,12.8,3,16.63,3,21.32c0,1.52,0.41,2.94,1.13,4.17c0.72,1.23,1.75,2.25,2.98,2.98c1.23,0.72,2.65,1.13,4.17,1.13c1.55,0,3-0.42,4.28-1.18c1.29-0.77,2.37-1.85,3.14-3.14c0.77-1.29,1.18-2.73,1.18-4.28c0-1.49-0.38-2.88-1.05-4.1c-0.67-1.22-1.61-2.25-2.75-3.03c-1.14-0.78-2.45-1.32-3.85-1.57c-0.2-0.04-0.4-0.07-0.6-0.1c-0.68-0.1-1.37-0.15-2.07-0.15c-3.31,0-6,2.69-6,6s2.69,6,6,6c1.66,0,3.16-0.67,4.24-1.76c1.08-1.08,1.76-2.58,1.76-4.24c0-0.66-0.11-1.3-0.31-1.9c-0.2-0.6-0.5-1.16-0.87-1.67c-0.37-0.51-0.82-0.96-1.32-1.32c-0.5-0.37-1.05-0.66-1.63-0.86c-0.58-0.2-1.19-0.3-1.81-0.3c-1.1,0-2.1,0.45-2.83,1.17c-0.73,0.73-1.17,1.72-1.17,2.83c0,0.41-0.34,0.75-0.75,0.75s-0.75-0.34-0.75-0.75c0-1.55,0.63-2.97,1.76-4.1c1.13-1.13,2.64-1.76,4.24-1.76c0.77,0,1.52,0.15,2.23,0.43c0.71,0.28,1.39,0.66,2.03,1.11c0.64,0.45,1.23,0.99,1.73,1.59c0.5,0.6,0.91,1.25,1.2,1.94c0.29,0.69,0.44,1.42,0.44,2.17c0,2.21-0.89,4.21-2.34,5.66c-1.45,1.45-3.45,2.34-5.66,2.34c-2.21,0-4.21-0.89-5.66-2.34c-1.45-1.45-2.34-3.45-2.34-5.66c0-4.41,3.58-8,8-8c1.7,0,3.3,0.54,4.65,1.48L23.19,9.52z"/>
    </svg>
);

const BlueskyIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.44 14.54c-1.18.66-2.58.98-4.08.92-2.1-.08-4.04-.9-5.46-2.32-1.42-1.42-2.24-3.36-2.32-5.46-.06-1.5.26-2.9.92-4.08C5.22 4.4 6.42 3.5 7.8 3.02c1.7-.58 3.54-.6 5.32-.04 1.78.56 3.3 1.62 4.3 3.08.82 1.2.9 2.5.88 3.84-.02.76-.18 1.5-4.3 3.58-1.16.58-2.36.9-3.58.9s-2.42-.32-3.58-.9c-1.16-.58-2.36-.9-3.58-.9-.16 0-.32.02-.48.04.18 2.38 1.2 4.54 2.86 5.92 1.66 1.38 3.78 2.06 5.92 2.02 1.72-.04 3.36-.54 4.7-1.44.1-.06.2-.14.28-.22.8-1.22 1.1-2.64.92-4.08-.02-.16-.04-.32-.06-.48.22.14.44.28.66.42 1.24.78 2.52 1.18 3.84 1.18.52 0 1.02-.08 1.5-.24-.44 1.74-1.5 3.26-3.06 4.3z"/>
    </svg>
);

const MediumIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M7.45 18.23a.6.6 0 0 1-.4-.14L.88 12.3a.6.6 0 0 1 0-.91l6.17-5.79a.6.6 0 0 1 .8.9L2.4 12l5.45 5.2a.6.6 0 0 1-.4 1.03zm5.72 0a.6.6 0 0 1-.4-.14L7.54 12.3a.6.6 0 0 1 0-.91l5.23-5.79a.6.6 0 0 1 .8.9L8.83 12l4.9 5.2a.6.6 0 0 1-.4 1.03zm5.1-5.32a3.8 3.8 0 0 1-3.79 3.79A3.8 3.8 0 0 1 14.7 13a3.8 3.8 0 0 1 3.78-3.79A3.8 3.8 0 0 1 22.25 13a3.8 3.8 0 0 1-3.78 3.79h-.2a3.5 3.5 0 0 1-3.23-3.23c0-1.6 1.3-2.9 2.9-2.9h.2a2.9 2.9 0 0 1 2.9 2.9z"/>
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
            { 
                name: 'Mastodon', 
                icon: <MastodonIcon className="h-4 w-4" />, 
                color: 'bg-[#2b90d9]', 
                profileUrl: 'https://mastodon.social/@w3develops',
                patterns: ['mastodon.social'] 
            },
            { 
                name: 'YouTube', 
                icon: <Youtube className="h-4 w-4" />, 
                color: 'bg-red-600', 
                profileUrl: 'https://www.youtube.com/w3Develops?sub_confirmation=1',
                patterns: ['YouTube', 'w3Develops'] 
            },
            { 
                name: 'Reddit', 
                icon: <RedditIcon className="h-4 w-4" />, 
                color: 'bg-[#ff4500]', 
                profileUrl: 'https://www.reddit.com/r/w3Develops/',
                patterns: ['reddit.com/r/w3Develops'] 
            },
            { 
                name: 'Medium', 
                icon: <MediumIcon className="h-4 w-4" />, 
                color: 'bg-black', 
                profileUrl: 'https://medium.com/w3develops',
                patterns: ['medium.com/w3develops'] 
            },
            { 
                name: 'X / Twitter', 
                icon: <Twitter className="h-4 w-4" />, 
                color: 'bg-black', 
                profileUrl: 'https://x.com/w3develops',
                patterns: ['x.com', 'twitter.com'] 
            },
            { 
                name: 'Bluesky', 
                icon: <BlueskyIcon className="h-4 w-4" />, 
                color: 'bg-[#0085ff]', 
                profileUrl: 'https://bsky.app/profile/w3develops.bsky.social',
                patterns: ['bsky.app'] 
            },
            { 
                name: 'LinkedIn', 
                icon: <Linkedin className="h-4 w-4" />, 
                color: 'bg-[#0077b5]', 
                profileUrl: 'https://www.linkedin.com/company/w3develops',
                patterns: ['linkedin.com'] 
            },
            { 
                name: 'Facebook', 
                icon: <Facebook className="h-4 w-4" />, 
                color: 'bg-[#1877f2]', 
                profileUrl: 'https://www.facebook.com/groups/w3develops/',
                patterns: ['facebook.com'] 
            },
            { 
                name: 'Instagram', 
                icon: <Instagram className="h-4 w-4" />, 
                color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', 
                profileUrl: 'https://www.instagram.com/w3develops/',
                patterns: ['instagram.com'] 
            },
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
                            Stay up to date with the developer ecosystem and w3Develops.
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
                                <AnnouncementItem key={announcement.id} announcement={announcement} />
                            ))
                        ) : (
                            <p className="text-sm text-center text-muted-foreground py-4">No recent announcements.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Community Pulse */}
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

            {/* Social Pulse Feed Section */}
            <section className="space-y-8 pt-12 border-t">
                <div className="text-center">
                    <h2 className="text-3xl font-bold font-headline">Latest from our Socials</h2>
                    <p className="text-muted-foreground mt-2">Direct updates from w3Develops across all platforms.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {socialPosts.map((platform) => (
                        <Card key={platform.name} className="flex flex-col h-full hover:shadow-lg transition-all border-t-4" style={{ borderTopColor: platform.post ? undefined : 'transparent' }}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-md ${platform.color} text-white`}>
                                            {platform.icon}
                                        </div>
                                        <span className="font-bold text-sm">{platform.name}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] uppercase">Official</Badge>
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
                                        <p className="text-xs text-muted-foreground italic mb-4">Connect with us on {platform.name}!</p>
                                        <Button asChild variant="secondary" size="sm" className="w-full">
                                            <a href={platform.profileUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                                                Follow w3Develops <ExternalLink className="h-3 w-3" />
                                            </a>
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
                            Stay connected with the w3Develops mission. Follow us across all platforms to never miss a community event, milestone, or update!
                        </p>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
