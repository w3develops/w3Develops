
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export const revalidate = 43200; // Revalidate every 12 hours

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

export async function GET() {
  try {
    const feed = await parser.parseURL(FEED_URL);
    if (!feed.items) {
      return NextResponse.json({ error: 'No items found in feed' }, { status: 500 });
    }

    const episodes: PodcastEpisode[] = feed.items
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

    return NextResponse.json(episodes);

  } catch (error) {
    console.error('Failed to fetch or parse podcast feed:', error);
    return NextResponse.json({ error: 'Failed to fetch podcast feed' }, { status: 500 });
  }
}
