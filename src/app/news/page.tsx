
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rss, Megaphone, Info, AlertTriangle, CheckCircle2, History, ChevronLeft, ChevronRight, Twitter, Youtube, ExternalLink, Facebook, Linkedin, Instagram } from "lucide-react";
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

// Corrected SVGs for platforms not in Lucide
const RedditIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.051l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.463 1.32-1.11 1.534.012.163.017.33.017.5 0 2.339-2.512 4.237-5.61 4.237-3.098 0-5.61-1.898-5.61-4.237 0-.17.005-.337.017-.5a1.754 1.754 0 0 1-1.11-1.534c0-.968.786-1.754 1.754-1.754.463 0 .875.182 1.185.476 1.162-.806 2.752-1.34 4.505-1.437l.887-4.157a.251.251 0 0 1 .193-.197l2.801-.59a1.25 1.25 0 0 1 1.117.26zm-4.361 9.465c-.012 0-.023.001-.035.001-1.483 0-2.69-1.206-2.69-2.689 0-1.483 1.207-2.69 2.69-2.69.012 0 .023.001.035.001 1.482 0 2.689 1.207 2.689 2.69 0 1.483-1.207 2.688-2.689 2.688z"/>
    </svg>
);

const MastodonIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path d="M23.193 7.879c0-5.206-3.411-6.732-3.411-6.732C18.062.357 15.108.025 12.041 0h-.076c-3.068.025-6.02.357-7.74 1.147 0 0-3.411 1.526-3.411 6.732 0 1.192-.023 2.618.015 4.129.124 5.092.934 10.109 5.641 11.355 2.17.574 4.034.694 5.535.612 2.722-.147 4.256-.9 4.256-.9l-.083-1.751s-1.909.549-4.248.48c-2.326-.074-4.805-.272-5.19-3.058-.04-.285-.041-.59-.033-.9 1.971.479 3.912.596 5.699.51 1.777-.086 3.584-.342 5.39-.735 3.191-.695 4.465-2.312 4.465-2.312.093-1.508.059-2.997.059-4.188zm-4.319 9.74h-2.428V9.255c0-1.281-.519-1.93-1.557-1.93-.864 0-1.484.59-1.861 1.771L12 10.829l-1.028-1.733c-.377-1.181-.997-1.771-1.861-1.771-1.038 0-1.557.65-1.557 1.93v8.364H5.126V9.149c0-2.428 1.556-3.624 3.557-3.624 1.162 0 2.056.445 2.688 1.312L12 7.829l.629-1.002c.632-.867 1.526-1.312 2.688-1.312 2.001 0 3.557 1.196 3.557 3.624v8.47z"/>
    </svg>
);

const BlueskyIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C3.405 1.447 1.457 1.62 1.457 3.412c0 1.501.97 5.56 1.457 7.027.652 1.965 2.143 2.436 4.003 2.236-1.859.2-3.351-.271-4.003-2.236-.487-1.467-1.457-5.526-1.457-7.027 0-1.792 1.948-1.965 3.745-.592 2.752 1.942 5.711 5.881 6.798 7.995 1.087-2.114 4.046-6.053 6.798-7.995 1.797-1.373 3.745-1.2 3.745.592 0 1.501-.97 5.56-1.456 7.027-.652 1.965-2.144 2.436-4.003 2.236 1.859.2 3.351-.271 4.003-2.236.487-1.467 1.457-5.526 1.457-7.027 0-1.792-1.948-1.965-3.745-.592-2.752 1.942-5.711 5.881-6.798 7.995zM12 13.2c-1.087 2.114-4.046 6.053-6.798 7.995-1.797 1.373-3.745 1.2-3.745-.592 0-1.501.97-5.56 1.457-7.027.652-1.965 2.143-2.436 4.003-2.236-1.859-.2-3.351.271-4.003 2.236-.487 1.467-1.457 5.526-1.457 7.027 0 1.792 1.948 1.965 3.745.592 2.752-1.942 5.711-5.881 6.798-7.995 1.087 2.114 4.046 6.053 6.798 7.995 1.797 1.373 3.745 1.2 3.745-.592 0-1.501-.97-5.56-1.456-7.027-.652-1.965-2.144-2.436-4.003-2.236 1.859-.2 3.351.271 4.003 2.236.487 1.467 1.457 5.526 1.457 7.027 0 1.792-1.948 1.965-3.745.592-2.752-1.942-5.711-5.881-6.798-7.995z"/>
    </svg>
);

const MediumIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M13.54 12a6.8 6.8 0 11-6.77-6.82A6.77 6.77 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42S14.2 15.54 14.2 12s1.51-6.42 3.38-6.42 3.38 2.88 3.38 6.42zM24 12c0 3.17-.53 5.75-1.19 5.75s-1.19-2.58-1.19-5.75.53-5.75 1.19-5.75S24 8.83 24 12z"/>
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

    // Social Feed Matching Logic
    const socialPosts = useMemo(() => {
        const platforms = [
            { 
                name: 'Mastodon', 
                icon: <MastodonIcon className="h-4 w-4" />, 
                color: 'bg-[#2b90d9]', 
                profileUrl: 'https://mastodon.social/@w3develops',
                patterns: ['mastodon.social', 'Mastodon'] 
            },
            { 
                name: 'YouTube', 
                icon: <Youtube className="h-4 w-4" />, 
                color: 'bg-red-600', 
                profileUrl: 'https://www.youtube.com/w3Develops?sub_confirmation=1',
                patterns: ['youtube.com', 'YouTube', 'w3Develops'] 
            },
            { 
                name: 'Reddit', 
                icon: <RedditIcon className="h-4 w-4" />, 
                color: 'bg-[#ff4500]', 
                profileUrl: 'https://www.reddit.com/r/w3Develops/',
                patterns: ['reddit.com'] 
            },
            { 
                name: 'Medium', 
                icon: <MediumIcon className="h-4 w-4" />, 
                color: 'bg-black', 
                profileUrl: 'https://medium.com/w3develops',
                patterns: ['medium.com'] 
            },
            { 
                name: 'Bluesky', 
                icon: <BlueskyIcon className="h-4 w-4" />, 
                color: 'bg-[#0085ff]', 
                profileUrl: 'https://bsky.app/profile/w3develops.bsky.social',
                patterns: ['bsky.app'] 
            },
            { 
                name: 'X / Twitter', 
                icon: <Twitter className="h-4 w-4" />, 
                color: 'bg-black', 
                profileUrl: 'https://x.com/w3develops',
                patterns: ['x.com', 'twitter.com'] 
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
            // Find the most recent item that matches this platform's signature
            const latest = newsItems.find(item => 
                platform.patterns.some(p => 
                    item.source.toLowerCase().includes(p.toLowerCase()) || 
                    item.link.toLowerCase().includes(p.toLowerCase())
                )
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
