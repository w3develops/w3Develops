import { revalidatePath, revalidateTag } from 'next/cache';
import { MEMBER_POSTS_CACHE_TAG } from '@/lib/public-items';

// Clears the cached /feed page and its posts, so the next visitor (or search
// engine) gets a fresh copy. functions/src/post-checks.ts calls it when a post
// leaves the public feed: hidden, deleted or made followers-only.
//
// It needs no sign-in, since it only throws away a cache, but it runs at most
// once every few seconds per server so it can't be used to load Firestore.
const COOLDOWN_MS = 5_000;
let lastRun = 0;

export async function POST() {
  const now = Date.now();
  if (now - lastRun < COOLDOWN_MS) {
    return Response.json({ refreshed: false, reason: 'Refreshed a moment ago' }, { status: 429 });
  }
  lastRun = now;
  revalidateTag(MEMBER_POSTS_CACHE_TAG, { expire: 0 });
  revalidatePath('/feed');
  return Response.json({ refreshed: true });
}
