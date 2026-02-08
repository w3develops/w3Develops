'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Podcast } from 'lucide-react';
import Image from 'next/image';

interface PodcastEpisode {
  title: string;
  link: string;
  isoDate: string;
  thumbnailUrl: string;
}

function formatDate(dateString: string) {
    if (!dateString) return 'No date';
    try {
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'long',
        }).format(new Date(dateString));
    } catch {
        return dateString;
    }
}

function PodcastPageSkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                    <div className="aspect-video w-full bg-muted rounded-t-lg"></div>
                    <CardHeader>
                        <div className="h-5 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/4 mt-2"></div>
                    </CardHeader>
                </Card>
            ))}
        </div>
    )
}

export default function PodcastPage() {
    const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEpisodes = async () => {
            try {
                setIsLoading(true);
                const res = await fetch('/api/podcast');
                if (!res.ok) {
                    throw new Error('Failed to fetch podcast episodes.');
                }
                const data: PodcastEpisode[] = await res.json();
                setEpisodes(data);
            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchEpisodes();
    }, []);


    return (
        <div className="max-w-7xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl flex items-center gap-3">
                        <Podcast className="h-8 w-8" />
                        w3Develops devTalks Podcast
                    </CardTitle>
                    <CardDescription>
                        Listen to our latest episodes, updated daily from our YouTube channel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && <PodcastPageSkeleton />}
                    {error && <p className="text-center text-destructive py-8">{error}</p>}
                    {!isLoading && !error && episodes.length > 0 && (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {episodes.map((episode) => (
                                <a href={episode.link} key={episode.link} target="_blank" rel="noopener noreferrer" className="block group">
                                    <Card className="h-full overflow-hidden hover:shadow-xl transition-shadow">
                                        <div className="aspect-video w-full relative overflow-hidden">
                                            <Image 
                                                src={episode.thumbnailUrl}
                                                alt={episode.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <CardHeader>
                                            <CardTitle className="text-lg group-hover:text-primary transition-colors">{episode.title}</CardTitle>
                                            <CardDescription>{formatDate(episode.isoDate)}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                </a>
                            ))}
                        </div>
                    )}
                     {!isLoading && !error && episodes.length === 0 && (
                        <div className="text-center py-12">
                            <h3 className="text-xl font-semibold">No Episodes Found</h3>
                            <p className="text-muted-foreground mt-2">
                                We couldn't find any podcast episodes at this time. Please check back later.
                            </p>
                        </div>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
