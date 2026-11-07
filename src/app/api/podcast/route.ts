
import { NextResponse } from 'next/server';
import { getPodcastEpisodes } from '@/lib/podcast';

// The route itself runs on every request; the episode list is cached in
// src/lib/podcast.ts.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getPodcastEpisodes());
  } catch (error) {
    // Only reached when nothing has loaded yet since the server started.
    console.error('Failed to fetch or parse podcast feed:', error);
    return NextResponse.json({ error: 'Failed to fetch podcast feed' }, { status: 500 });
  }
}
