import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Podcast } from 'lucide-react';
import Image from 'next/image';
import { getPodcastEpisodes, type PodcastEpisode } from '@/lib/podcast';
import { pageMetadata } from '@/lib/site-pages';

export const metadata: Metadata = pageMetadata('/podcast');

// Rendered on the server for each visit, so search engines and AI crawlers
// see the episode list; the list itself is cached in src/lib/podcast.ts.
export const dynamic = 'force-dynamic';

function formatDate(dateString: string) {
    if (!dateString) return 'No date';
    try {
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'long',
            timeZone: 'UTC',
        }).format(new Date(dateString));
    } catch {
        return dateString;
    }
}

export default async function PodcastPage() {
    let episodes: PodcastEpisode[] = [];
    let error: string | null = null;
    try {
        episodes = await getPodcastEpisodes();
    } catch (err) {
        console.error('Failed to fetch or parse podcast feed:', err);
        error = 'Failed to fetch podcast episodes.';
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <CardTitle as="h1" className="font-headline text-3xl flex items-center gap-3">
                        <Podcast className="h-8 w-8" />
                        w3Develops devTalks Podcast
                    </CardTitle>
                    <CardDescription>
                        Listen to our latest episodes from our YouTube channel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && <p className="text-center text-destructive py-8">{error}</p>}
                    {!error && episodes.length > 0 && (
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
                                            <CardTitle as="h2" className="text-lg group-hover:text-primary transition-colors">{episode.title}</CardTitle>
                                            <CardDescription>{formatDate(episode.isoDate)}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                </a>
                            ))}
                        </div>
                    )}
                    {!error && episodes.length === 0 && (
                        <div className="text-center py-12">
                            <h2 className="text-xl font-semibold">No Episodes Found</h2>
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
