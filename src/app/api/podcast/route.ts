
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import Parser from 'rss-parser';

// The route itself runs on every request; the episode list is cached below.
export const dynamic = 'force-dynamic';

const REFRESH_SECONDS = 43200; // Check YouTube for new episodes every 12 hours

interface PodcastEpisode {
  title: string;
  link: string;
  isoDate: string;
  thumbnailUrl: string;
}

const parser = new Parser();

const YOUTUBE_PLAYLIST_ID = 'PLTwiqKOPckq-z5E-LUpMXpcv_GWXE2k4F';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?playlist_id=${YOUTUBE_PLAYLIST_ID}`;

function getVideoId(link: string): string | null {
    if (!link) return null;
    try {
        const url = new URL(link);
        return url.searchParams.get('v');
    } catch (error) {
        return null;
    }
}

// Throws when YouTube's feed can't be read, so a failure is never cached.
// When a refresh fails, Next keeps serving the last list that loaded.
async function fetchEpisodes(): Promise<PodcastEpisode[]> {
  const feed = await parser.parseURL(FEED_URL);

  const episodes = (feed.items ?? [])
    .map(item => {
      if (!item.title || !item.link || !item.isoDate) {
        return null;
      }
      const videoId = getVideoId(item.link);
      if (!videoId) {
        return null;
      }

      return {
        title: item.title,
        link: item.link,
        isoDate: item.isoDate,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      };
    })
    .filter((item): item is PodcastEpisode => item !== null)
    .sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime());

  if (episodes.length === 0) {
    throw new Error('The podcast feed had no episodes');
  }
  return episodes;
}

const getEpisodes = unstable_cache(fetchEpisodes, ['podcast-episodes', YOUTUBE_PLAYLIST_ID], {
  revalidate: REFRESH_SECONDS,
});

export async function GET() {
  try {
    return NextResponse.json(await getEpisodes());
  } catch (error) {
    // Only reached when nothing has loaded yet since the server started.
    console.error('Failed to fetch or parse podcast feed:', error);
    return NextResponse.json({ error: 'Failed to fetch podcast feed' }, { status: 500 });
  }
}
