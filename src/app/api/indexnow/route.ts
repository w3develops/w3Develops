import { NextResponse } from 'next/server';
import { getPublicItem, PUBLIC_ITEM_PAGES, type PublicCollection } from '@/lib/public-items';
import { submitToIndexNow } from '@/lib/indexnow';

// The browser calls this after a member creates or edits a study group,
// project, book club, meetup, competition or job, so search engines hear
// about the page straight away. Only real, public item pages are sent, and
// each one at most once every ten minutes.

export const dynamic = 'force-dynamic';

const RESEND_AFTER_MS = 10 * 60 * 1000;
const recentlySent = new Map<string, number>();

const collectionByPath = new Map<string, PublicCollection>(
  Object.entries(PUBLIC_ITEM_PAGES).map(([collectionName, basePath]) => [basePath, collectionName as PublicCollection]),
);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { path?: unknown } | null;
  const path = typeof body?.path === 'string' ? body.path : '';
  const match = /^(\/[a-z-]+)\/([A-Za-z0-9]{1,64})$/.exec(path);
  const collectionName = match && collectionByPath.get(match[1]);
  if (!match || !collectionName) {
    return NextResponse.json({ error: 'Not a public item page' }, { status: 400 });
  }

  const now = Date.now();
  for (const [sentPath, sentAt] of recentlySent) {
    if (now - sentAt > RESEND_AFTER_MS) recentlySent.delete(sentPath);
  }
  if (recentlySent.has(path)) return NextResponse.json({ sent: false, reason: 'sent recently' });

  if (!(await getPublicItem(collectionName, match[2]))) {
    return NextResponse.json({ error: 'No such page' }, { status: 404 });
  }
  recentlySent.set(path, now);
  return NextResponse.json({ sent: await submitToIndexNow([path]) });
}
