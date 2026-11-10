import { getPublicList, PUBLIC_ITEM_PAGES, type PublicCollection } from '@/lib/public-items';
import { SITE_NAME, SITE_URL } from '@/lib/site-pages';

// An RSS feed of what's new on w3Develops: the latest posts, study groups,
// group projects, book clubs, meetups, competitions and jobs, newest first.
// Feed readers and sites that follow w3Develops use it; the layout points to
// it from every page.

// Rebuilt at most once an hour
export const revalidate = 3600;

const PER_KIND = 15;
const MAX_ITEMS = 50;

const KINDS: { collection: PublicCollection; label: string; titleField: 'name' | 'title' }[] = [
  { collection: 'studyGroups', label: 'Study group', titleField: 'name' },
  { collection: 'groupProjects', label: 'Group project', titleField: 'name' },
  { collection: 'bookClubs', label: 'Book club', titleField: 'name' },
  { collection: 'meetups', label: 'Meetup', titleField: 'name' },
  { collection: 'competitions', label: 'Competition', titleField: 'name' },
  { collection: 'jobs', label: 'Job', titleField: 'title' },
  { collection: 'posts', label: 'Post', titleField: 'title' },
];

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const millisOf = (value: unknown) =>
  value && typeof value === 'object' && typeof (value as { __timestamp?: unknown }).__timestamp === 'number'
    ? (value as { __timestamp: number }).__timestamp
    : null;

const shorten = (text: string, max = 400) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
};

export async function GET() {
  const lists = await Promise.all(KINDS.map(async kind => {
    const items = await getPublicList({ collection: kind.collection, orderBy: 'createdAt', direction: 'desc', limit: PER_KIND });
    return (items ?? []).map(raw => {
      const item = raw as Record<string, unknown>;
      const title = typeof item[kind.titleField] === 'string' ? (item[kind.titleField] as string) : '';
      const created = millisOf(item.createdAt);
      if (!title || created === null) return null;
      return {
        title,
        category: kind.label,
        link: `${SITE_URL}${PUBLIC_ITEM_PAGES[kind.collection]}/${item.id}`,
        description: typeof item.description === 'string' ? shorten(item.description) : '',
        created,
      };
    }).filter(item => item !== null);
  }));
  const items = lists.flat().sort((a, b) => b.created - a.created).slice(0, MAX_ITEMS);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(`What's new on ${SITE_NAME}`)}</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>The latest posts, study groups, group projects, book clubs, meetups, competitions and jobs on w3Develops, a free developer community.</description>
    <language>en</language>
${items.map(item => `    <item>
      <title>${escape(`${item.category}: ${item.title}`)}</title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <category>${escape(item.category)}</category>
      <pubDate>${new Date(item.created).toUTCString()}</pubDate>${item.description ? `
      <description>${escape(item.description)}</description>` : ''}
    </item>`).join('\n')}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
