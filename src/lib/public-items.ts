// Server code only: import it from server pages, never from 'use client' files
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { collection, doc, getDoc, getDocs, limit, query, type Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/initialize-app';
import { toPlain } from '@/firebase/firestore/plain';
import { SITE_NAME, sharePreview } from '@/lib/site-pages';

// Study groups, projects, meetups and the like are public, so their pages are
// rendered with real content on the server: search engines and AI crawlers
// can read them, and visitors see them straight away. The browser then
// switches to the live copy. Fetches go through the site's own Firebase setup,
// as an anonymous reader, so the Firestore rules decide what's public.

/** The public item pages, by Firestore collection, and where each lives */
export const PUBLIC_ITEM_PAGES = {
  studyGroups: '/studygroups',
  groupProjects: '/groupprojects',
  bookClubs: '/book-clubs',
  meetups: '/meetups',
  competitions: '/competitions',
  jobs: '/job-board',
} as const;
export type PublicCollection = keyof typeof PUBLIC_ITEM_PAGES;

// A few minutes is fresh enough for search engines and keeps Firestore reads low
const ITEM_CACHE_SECONDS = 5 * 60;

class ItemNotFound extends Error {}

// Throws for a missing item, so "not found" is never cached: an item created
// a moment ago shows up as soon as someone opens it
const fetchItem = unstable_cache(
  async (collectionName: PublicCollection, id: string) => {
    const snap = await getDoc(doc(initializeFirebase().firestore, collectionName, id));
    if (!snap.exists()) throw new ItemNotFound();
    return toPlain({ ...snap.data(), id: snap.id }) as Record<string, unknown>;
  },
  ['public-item'],
  { revalidate: ITEM_CACHE_SECONDS },
);

/** The item as a plain object for a browser component, or null if it can't be read */
export async function getPublicItem(collectionName: PublicCollection, id: string): Promise<Record<string, unknown> | null> {
  try {
    return await fetchItem(collectionName, id);
  } catch (error) {
    if (!(error instanceof ItemNotFound)) console.warn(`Could not read ${collectionName}/${id} on the server:`, error);
    return null;
  }
}

function shorten(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

/** Title, description, preferred address and link preview for an item page */
export function itemMetadata(
  item: Record<string, unknown> | null,
  { path, name, fallbackDescription, kindLabel }: { path: string; name: string | undefined; fallbackDescription: string; kindLabel: string },
): Metadata {
  if (!item || !name) {
    // Missing or unreadable: keep it out of search results
    return { title: kindLabel, robots: { index: false } };
  }
  const description = shorten(typeof item.description === 'string' && item.description.trim() ? item.description : fallbackDescription);
  return {
    title: name,
    description,
    alternates: { canonical: path },
    ...sharePreview(`${name} | ${SITE_NAME}`, description, path),
  };
}

// The sitemap's list of items changes rarely; an hour keeps reads low
const SITEMAP_CACHE_SECONDS = 60 * 60;
const SITEMAP_LIMIT_PER_COLLECTION = 1000;

/** Every public item page, with when it last changed where that's known */
export const listPublicItemPages = unstable_cache(
  async (): Promise<{ path: string; lastModified?: string }[]> => {
    const firestore = initializeFirebase().firestore;
    const pages: { path: string; lastModified?: string }[] = [];
    for (const [collectionName, basePath] of Object.entries(PUBLIC_ITEM_PAGES)) {
      try {
        const snap = await getDocs(query(collection(firestore, collectionName), limit(SITEMAP_LIMIT_PER_COLLECTION)));
        for (const item of snap.docs) {
          const data = item.data();
          const changed = (data.updatedAt ?? data.createdAt) as Timestamp | undefined;
          pages.push({
            path: `${basePath}/${item.id}`,
            lastModified: typeof changed?.toDate === 'function' ? changed.toDate().toISOString() : undefined,
          });
        }
      } catch (error) {
        console.warn(`Could not list ${collectionName} for the sitemap:`, error);
      }
    }
    return pages;
  },
  ['public-item-pages'],
  { revalidate: SITEMAP_CACHE_SECONDS },
);
