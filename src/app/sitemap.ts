import type { MetadataRoute } from 'next';
import { INDEXABLE_PATHS, SITE_URL } from '@/lib/site-pages';

// Only public pages: no account, sign-in, "create" or members-only pages,
// which search engines can't usefully show. Built from src/lib/site-pages.ts.
// No last-modified dates, since a deploy date for every page would be wrong
// and teaches search engines to ignore them.
export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_PATHS.map(path => ({ url: `${SITE_URL}${path === '/' ? '' : path}` }));
}
