
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

// Reusable SVGs for platforms not in Lucide
const RedditIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 11.5c0-1.65-1.35-3-3-3-.4 0-.78.08-1.13.24-1.64-1.24-3.86-2.03-6.29-2.13l1.08-5.11 3.53.75c.05 1 .9 1.8 1.93 1.8 1.07 0 1.93-.88 1.93-1.97S21.2 0 20.13 0c-.83 0-1.54.54-1.81 1.29l-3.97-.85c-.11-.02-.22.01-.3.09-.09.07-.13.18-.11.29l-1.2 5.62c-2.48.01-4.77.8-6.47 2.06-.35-.16-.73-.24-1.13-.24-1.65 0-3 1.35-3 3 0 1.05.54 1.98 1.35 2.52-.03.16-.05.33-.05.5 0 3.59 4.03 6.5 9 6.5s9-2.91 9-6.5c0-.17-.02-.34-.05-.5.81-.54 1.35-1.47 1.35-2.52zM7.03 13.5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9.15 4.66c-1.11 1.11-3.2 1.19-4.18 1.19s-3.07-.08-4.18-1.19c-.15-.15-.15-.4 0-.55.15-.15.4-.15.55 0 .82.81 2.51.94 3.63.94s2.81-.13 3.63-.94c.15-.15.4-.15.55 0 .15.15.15.41 0 .55zM14.97 15.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>
);

const MastodonIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.193 7.879c0-5.206-3.411-6.732-3.411-6.732C18.062.357 15.108.025 12.041 0h-.076c-3.068.025-6.02.357-7.74 1.147 0 0-3.411 1.526-3.411 6.732 0 1.192-.023 2.618.015 4.129.124 5.092.934 10.109 5.641 11.355 2.17.574 4.034.694 5.535.612 2.722-.147 4.256-.9 4.256-.9l-.083-1.751s-1.909.549-4.248.48c-2.326-.074-4.805-.272-5.19-3.058-.04-.285-.041-.59-.033-.9 1.971.479 3.912.596 5.699.51 1.777-.086 3.584-.342 5.39-.735 3.191-.695 4.465-2.312 4.465-2.312.093-1.508.059-2.997.059-4.188zm-4.319 9.74h-2.428V9.255c0-1.281-.519-1.93-1.557-1.93-.864 0-1.484.59-1.861 1.771L12 10.829l-1.028-1.733c-.377-1.181-.997-1.771-1.861-1.771-1.038 0-1.557.65-1.557 1.93v8.364H5.126V9.149c0-2.428 1.556-3.624 3.557-3.624 1.162 0 2.056.445 2.688 1.312L12 7.829l.629-1.002c.632-.867 1.526-1.312 2.688-1.312 2.001 0 3.557 1.196 3.557 3.624v8.47z"/>
  </svg>
);

const BlueskyIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C3.405 1.447 1.457 1.62 1.457 3.412c0 1.501.97 5.56 1.457 7.027.652 1.965 2.143 2.436 4.003 2.236-1.859.2-3.351-.271-4.003-2.236-.487-1.467-1.457-5.526-1.457-7.027 0-1.792 1.948-1.965 3.745-.592 2.752 1.942 5.711 5.881 6.798 7.995 1.087-2.114 4.046-6.053 6.798-7.995 1.797-1.373 3.745-1.2 3.745.592 0 1.501-.97 5.56-1.456 7.027-.652 1.965-2.144 2.436-4.003 2.236 1.859.2 3.351-.271 4.003-2.236.487-1.467 1.457-5.526 1.457-7.027 0-1.792-1.948-1.965-3.745-.592-2.752 1.942-5.711 5.881-6.798 7.995zM12 13.2c-1.087 2.114-4.046 6.053-6.798 7.995-1.797 1.373-3.745 1.2-3.745-.592 0-1.501.97-5.56 1.457-7.027.652-1.965 2.143-2.436 4.003-2.236-1.859-.2-3.351.271-4.003 2.236-.487 1.467-1.457-5.526-1.457 7.027 0 1.792 1.948 1.965 3.745.592 2.752-1.942 5.711-5.881 6.798-7.995 1.087 2.114 4.046 6.053 6.798 7.995 1.797 1.373 3.745 1.2 3.745-.592 0-1.501-.97-5.56 1.457-7.027.652-1.965-2.144-2.436-4.003-2.236 1.859-.2 3.351.271 4.003 2.236.487 1.467 1.457-5.526 1.457 7.027 0 1.792-1.948 1.965-3.745.592-2.752-1.942-5.711-5.881-6.798-7.995z"/>
  </svg>
);

const MediumIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13.54 12a6.8 6.8 0 11-6.77-6.82A6.77 6.77 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42S14.2 15.54 14.2 12s1.51-6.42 3.38-6.42 3.38 2.88 3.38 6.42zM24 12c0 3.17-.53 5.75-1.19 5.75s-1.19-2.58-1.19-5.75.53-5.75 1.19-5.75S24 8.83 24 12z"/>
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4464.8245-.6667 1.2835-2.083-0.2874-4.2238-0.2874-6.3067 0-.2203-.459-.4557-.9082-.6667-1.2835a.077.077 0 0 0-.0785-.0371 19.7363 19.7363 0 0 0-4.8851 1.5152.069.069 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.5767.8851-1.1916 1.29-1.854a.0722.0722 0 0 0-.028-.0943c-.5843-.2956-1.1498-.6351-1.6853-1.0176a.0744.0744 0 0 1 .0015-.1186c.1348-.1044.2717-.2088.406-.3154a.0779.0779 0 0 1 .099-.0057c.9737.6159 2.0318 1.1512 3.1373 1.5729a.0759.0759 0 0 0 .0879-.0023c1.1055-.4217 2.1636-.957 3.1373-1.5729a.0779.0779 0 0 1 .099.0057c.1343.1066.2712.211.406.3154a.0744.0744 0 0 1 .0015.1186c-.5355.3825-1.101.722-1.6853 1.0176a.0722.0722 0 0 0-.028.0943c.4048.6624.8283 1.2773 1.29 1.854a.0777.0777 0 0 0 .0842.0276c1.9516-.6067 3.9401-1.5219 5.9929-3.0294a.0824.0824 0 0 0 .0312-.0561c.4182-4.4779-.4337-9.012-.9581-13.6602a.069.069 0 0 0-.0321-.0277zM8.02 15.3312c-.9416 0-1.7041-1.0125-1.7041-2.2625s.7625-2.2625 1.7041-2.2625c.9416 0 1.7041 1.0125 1.7041 2.2625s-.7625 2.2625-1.7041 2.2625zm7.9599 0c-.9416 0-1.7041-1.0125-1.7041-2.2625s.7625-2.2625 1.7041-2.2625c.9416 0 1.7041 1.0125 1.7041 2.2625s-.7625 2.2625-1.7041 2.2625z"/>
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

    const totalPages = Math.ceil(newsItems.length / ITEMS_PER_PAGE);
    const paginatedNews = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return newsItems.slice(start, start + ITEMS_PER_PAGE);
    }, [newsItems, currentPage]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
                                <AnnouncementItem key={announcement.id} announcement={announcement} />
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
