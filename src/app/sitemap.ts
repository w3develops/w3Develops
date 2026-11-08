import type { MetadataRoute } from 'next';
import { INDEXABLE_PATHS, SITE_URL } from '@/lib/site-pages';
import { listPublicItemPages } from '@/lib/public-items';

// Rebuilt at most once an hour, so new groups, meetups and jobs get listed
export const revalidate = 3600;

// Public pages only: no account, sign-in, "create" or members-only pages,
// which search engines can't usefully show. The main pages come from
// src/lib/site-pages.ts, and every public study group, project, book club,
// meetup, competition and job is added with the date it last changed, along
// with member profiles that have a bio or skills.
// Main pages have no date, since a deploy date for every page would be wrong
// and teaches search engines to ignore them.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const mainPages = INDEXABLE_PATHS.map(path => ({ url: `${SITE_URL}${path === '/' ? '' : path}` }));
  const itemPages = (await listPublicItemPages()).map(({ path, lastModified }) => ({
    url: `${SITE_URL}${path}`,
    ...(lastModified && { lastModified }),
  }));
  return [...mainPages, ...itemPages];
}
