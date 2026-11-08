import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Podcast } from 'lucide-react';
import Image from 'next/image';
import { getPodcastEpisodes, PLAYLIST_URL, YOUTUBE_PLAYLIST_ID, type PodcastEpisode } from '@/lib/podcast';
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

// YouTube's own playlist player. Shown when the episode list can't be read
// from YouTube's feed, which has been returning 404s, so visitors can still
// watch every episode.
function PlaylistPlayer() {
    return (
        <div className="space-y-4">
            <div className="aspect-video w-full overflow-hidden rounded-lg">
                <iframe
                    src={`https://www.youtube-nocookie.com/embed/videoseries?list=${YOUTUBE_PLAYLIST_ID}`}
                    title="w3Develops devTalks Podcast playlist"
                    className="h-full w-full"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    loading="lazy"
                />
            </div>
            <p className="text-center text-muted-foreground">
                <a href={PLAYLIST_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    See all episodes on YouTube
                </a>
            </p>
        </div>
    );
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
    const showPlayer = Boolean(error) || episodes.length === 0;

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
                    {showPlayer && <PlaylistPlayer />}
                    {!showPlayer && (
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
                </CardContent>
            </Card>
        </div>
    );
}
