// Server code only: import it from server pages, never from 'use client' files
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import type { Timestamp } from 'firebase/firestore';
import { readDoc, readList } from '@/lib/server-db';
import { toPlain } from '@/firebase/firestore/plain';
import { SITE_NAME, sharePreview } from '@/lib/site-pages';

// Study groups, projects, meetups and the like are public, so their pages are
// rendered with real content on the server: search engines and AI crawlers
// can read them, and visitors see them straight away. The browser then
// switches to the live copy. Reads go through src/lib/server-db.ts, which
// uses the Admin SDK on Google Cloud and so skips the Firestore rules: only
// read collections that are public to everyone, and pick public fields only.

/** The public item pages, by Firestore collection, and where each lives */
export const PUBLIC_ITEM_PAGES = {
  studyGroups: '/studygroups',
  groupProjects: '/groupprojects',
  bookClubs: '/book-clubs',
  meetups: '/meetups',
  competitions: '/competitions',
  jobs: '/job-board',
  posts: '/news/posts',
  organizations: '/orgs',
} as const;
export type PublicCollection = keyof typeof PUBLIC_ITEM_PAGES;

// A few minutes is fresh enough for search engines and keeps Firestore reads low
const ITEM_CACHE_SECONDS = 5 * 60;

class ItemNotFound extends Error {}

// Throws for a missing item, so "not found" is never cached: an item created
// a moment ago shows up as soon as someone opens it
const fetchItem = unstable_cache(
  async (collectionName: PublicCollection, id: string) => {
    const item = await readDoc(collectionName, id);
    if (!item) throw new ItemNotFound();
    return toPlain({ ...item.data, id: item.id }) as Record<string, unknown>;
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

// What a member's public profile page shows. Everything else on the user
// document (timezone, sign-in times, settings, connection IDs) stays out of
// the page's HTML; members never have an email address stored there.
const PUBLIC_PROFILE_FIELDS = [
  'username', 'profilePictureUrl', 'bio', 'socialLinks', 'skills', 'createdAt', 'followInfoPrivate', 'privateAccount',
  'mentorshipRole', 'tutorRole', 'pairProgrammingStatus', 'soloProjectIds',
] as const;

const fetchProfile = unstable_cache(
  async (userId: string) => {
    const member = await readDoc('users', userId);
    if (!member) throw new ItemNotFound();
    const data = member.data;
    const profile: Record<string, unknown> = { id: member.id };
    for (const field of PUBLIC_PROFILE_FIELDS) {
      if (data[field] !== undefined) profile[field] = data[field];
    }
    // Follower lists are public unless the member hid them
    if (!data.followInfoPrivate) {
      profile.followers = data.followers ?? [];
      profile.following = data.following ?? [];
    }
    return toPlain(profile) as Record<string, unknown>;
  },
  ['public-profile'],
  { revalidate: ITEM_CACHE_SECONDS },
);

/** A member's public profile as a plain object, or null if it can't be read */
export async function getPublicProfile(userId: string): Promise<Record<string, unknown> | null> {
  try {
    return await fetchProfile(userId);
  } catch (error) {
    if (!(error instanceof ItemNotFound)) console.warn(`Could not read users/${userId} on the server:`, error);
    return null;
  }
}

/**
 * Whether a profile says enough about the member to be worth a search
 * result. Empty profiles stay out of search engines, so they don't crowd
 * out the site's useful pages.
 */
export function profileHasContent(profile: { bio?: unknown; skills?: unknown }): boolean {
  return (typeof profile.bio === 'string' && profile.bio.trim().length > 0)
    || (Array.isArray(profile.skills) && profile.skills.length > 0);
}

/**
 * A list page's query, in a form that can be cached: the collection, how to
 * sort it, how many to show, and optionally a time cutoff on one field
 * (milliseconds; round it, so the cache gets reused).
 */
export interface PublicListQuery {
  collection: PublicCollection | 'soloProjects' | 'announcements' | 'memberPosts';
  /**
   * Only documents whose fields have these values. Member posts must pass
   * status == 'visible' and audience == 'public': the Admin SDK skips the
   * rules, which would otherwise keep hidden and followers-only posts out.
   * Needs a composite index with orderBy.
   */
  equals?: { field: string; value: string } | { field: string; value: string }[];
  orderBy: string;
  direction: 'asc' | 'desc';
  limit: number;
  after?: { field: string; op: '<' | '<=' | '>' | '>='; millis: number };
}

async function readPublicList(list: PublicListQuery) {
  const docs = await readList({
    collection: list.collection,
    where: list.after,
    equals: list.equals,
    orderBy: { field: list.orderBy, direction: list.direction },
    limit: list.limit,
  });
  return docs.map(item => toPlain({ ...item.data, id: item.id }));
}

const fetchList = unstable_cache(readPublicList, ['public-list'], { revalidate: ITEM_CACHE_SECONDS });

/**
 * Tag on the cached community feed posts. functions/src/post-checks.ts asks
 * /api/revalidate/feed to clear it whenever a post leaves the public feed,
 * so a hidden or deleted post doesn't linger in the page's HTML.
 */
export const MEMBER_POSTS_CACHE_TAG = 'member-posts';
const fetchMemberPosts = unstable_cache(readPublicList, ['public-list-member-posts'], {
  revalidate: ITEM_CACHE_SECONDS,
  tags: [MEMBER_POSTS_CACHE_TAG],
});

// One member post for its own page (/feed/<id>), only while it's visible and
// public: the Admin SDK skips the rules, which keep the rest private
const fetchMemberPost = unstable_cache(
  async (postId: string) => {
    const post = await readDoc('memberPosts', postId);
    if (!post || post.data.status !== 'visible' || post.data.audience !== 'public') return null;
    return toPlain({ ...post.data, id: post.id }) as Record<string, unknown>;
  },
  ['public-member-post'],
  { revalidate: ITEM_CACHE_SECONDS, tags: [MEMBER_POSTS_CACHE_TAG] },
);

/** A visible public member post as a plain object, or null */
export async function getPublicMemberPost(postId: string): Promise<Record<string, unknown> | null> {
  try {
    return await fetchMemberPost(postId);
  } catch (error) {
    console.warn(`Could not read memberPosts/${postId} on the server:`, error);
    return null;
  }
}

/**
 * A list page's items as plain objects for a browser component, which shows
 * them until its live query answers; null if they can't be read, so the page
 * just loads them in the browser as before.
 */
export async function getPublicList(list: PublicListQuery): Promise<unknown[] | null> {
  try {
    return await (list.collection === 'memberPosts' ? fetchMemberPosts(list) : fetchList(list));
  } catch (error) {
    console.warn(`Could not list ${list.collection} on the server:`, error);
    return null;
  }
}

/** The current time rounded down, so cached lists built from it get reused */
export function roundedNow(stepMs = 5 * 60 * 1000): number {
  return Math.floor(Date.now() / stepMs) * stepMs;
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

/** Every public item page and member profile, with when it last changed where that's known */
export const listPublicItemPages = unstable_cache(
  async (): Promise<{ path: string; lastModified?: string }[]> => {
    const pages: { path: string; lastModified?: string }[] = [];
    for (const [collectionName, basePath] of Object.entries(PUBLIC_ITEM_PAGES)) {
      try {
        const items = await readList({ collection: collectionName, limit: SITEMAP_LIMIT_PER_COLLECTION });
        for (const item of items) {
          const data = item.data;
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
    // Member profiles that say something about the member. Profiles have no
    // "last changed" date, so none is given.
    try {
      const members = await readList({ collection: 'users', limit: SITEMAP_LIMIT_PER_COLLECTION });
      for (const member of members) {
        if (profileHasContent(member.data)) pages.push({ path: `/users/${member.id}` });
      }
    } catch (error) {
      console.warn('Could not list member profiles for the sitemap:', error);
    }
    return pages;
  },
  ['public-item-pages'],
  { revalidate: SITEMAP_CACHE_SECONDS },
);
