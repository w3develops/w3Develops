// A daily news roundup for one topic, from that topic's RSS feeds
// (src/lib/rss-feeds.ts). Written from templates: it lists a handful of new
// stories with their headlines, publishers and links, and notes what they
// have in common. It never copies article text; readers follow the links to
// the publishers for the stories themselves.
import Parser from 'rss-parser';
import { logger } from 'firebase-functions';
import { Timestamp } from 'firebase-admin/firestore';
import { feedNames, feedsByTopic } from './shared/rss-feeds.js';
import { postTopic, type PostTopic } from './shared/post-topics.js';
import type { PostContext, PostDraft, PostItem } from './posts.js';

type NewsTopic = Exclude<PostTopic, 'community'>;

/** At most this many stories per roundup */
const MAX_STORIES = 6;
/** Fewer new stories than this, and the roundup is skipped for the day */
const MIN_STORIES = 3;
/** So one busy publisher can't fill the roundup */
const MAX_PER_SOURCE = 2;
const MAX_TITLE_LENGTH = 200;

export interface Story {
  title: string;
  link: string;
  source: string;
  published: number;
}

// Pages on w3Develops worth a look after each topic's news
const RELATED: Record<NewsTopic, { text: string; link: string }[]> = {
  hardware: [
    { text: 'Build something with a group project team', link: '/groupprojects' },
    { text: 'Find a hackerspace near you', link: '/hackerspaces' },
  ],
  software: [
    { text: 'Learn a language or framework in a study group', link: '/studygroups' },
    { text: 'Bug bounty platforms', link: '/bug-bounties' },
  ],
  crypto: [
    { text: 'Study blockchain with other developers', link: '/studygroups' },
    { text: 'Competitions and hackathons', link: '/competitions' },
  ],
  business: [
    { text: 'The w3Develops job board', link: '/job-board' },
    { text: 'Find a mentor', link: '/mentorship' },
  ],
  marketing: [
    { text: 'Learn digital marketing', link: '/learn' },
    { text: 'Read with a book club', link: '/book-clubs' },
  ],
  sales: [
    { text: 'The w3Develops job board', link: '/job-board' },
    { text: 'Find a mentor', link: '/mentorship' },
  ],
  opensource: [
    { text: 'Contribute to w3Develops', link: '/contribute' },
    { text: 'Show off your own project', link: '/solo-projects' },
  ],
};

const INTROS: Record<NewsTopic, string> = {
  hardware: 'New chips, devices and robots shape what we get to build with.',
  software: 'Releases and security news are worth a few minutes of every developer\'s day: a new version can save you work, and a new vulnerability can cost you a weekend.',
  crypto: 'Whatever you think of the market, the technology under it (wallets, smart contracts and cryptography) is worth understanding.',
  business: 'The business side of tech decides which products get built and who gets hired to build them.',
  marketing: 'Building something is half the job; the other half is getting it in front of people.',
  sales: 'Every product needs someone to sell it, and developers who understand sales build things people buy.',
  opensource: 'Open source projects and the nonprofits behind them keep much of the internet running.',
};

// Words too common to say anything about what the stories share
const STOP_WORDS = new Set(`a about after all also an and any are as at be been but by can could did do does for from
had has have how i if in into is it its just more most new news not now of on one or our out over says so than that
the their them then there these they this to too up us was we were what when where which who why will with would you
your vs via get gets how's what's it's here year years day week today first last next amid back off make makes
report reports update updates latest best top big like using use used`.split(/\s+/));

const parser = new Parser({ timeout: 8000, headers: { 'User-Agent': 'w3DevelopsBot/1.0 (+https://w3develops.org)' } });

const tidy = (text: string) => text.replace(/\s+/g, ' ').trim();

/** A feed's name without its tagline: "CoinDesk", not "CoinDesk: Bitcoin, Ethereum, Crypto News and Price Data" */
export function sourceName(feedTitle: string): string {
  return tidy(tidy(feedTitle).split(/:\s|\s[|–—-]\s/)[0]).slice(0, 80);
}

/** Only ordinary web links, so a feed can't slip in a javascript: link */
export function safeLink(link: string | undefined): string | null {
  if (!link) return null;
  try {
    const url = new URL(link.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** The same story is often in two feeds, with tracking tags or a different case */
function storyKey(story: Story): { link: string; title: string } {
  let link = story.link;
  try {
    const url = new URL(story.link);
    for (const param of [...url.searchParams.keys()]) {
      if (/^(utm_|ref$|source$|mc_)/.test(param)) url.searchParams.delete(param);
    }
    url.hash = '';
    link = `${url.host.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}${url.search}`;
  } catch { /* keep the raw link */ }
  const title = story.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return { link, title };
}

/** A feed that hasn't answered by then is left out, so one slow site can't hold up the post */
const FEED_DEADLINE_MS = 15_000;

async function readFeed(feedUrl: string, since: number, now: number): Promise<Story[]> {
  try {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('timed out')), FEED_DEADLINE_MS); });
    const feed = await Promise.race([parser.parseURL(feedUrl), deadline]).finally(() => clearTimeout(timer));
    const source = feedNames[feedUrl] ?? (sourceName(feed.title ?? '') || new URL(feedUrl).hostname.replace(/^www\./, ''));
    return (feed.items ?? []).flatMap(item => {
      const published = item.isoDate ? Date.parse(item.isoDate) : NaN;
      const link = safeLink(item.link);
      const title = tidy(item.title ?? '');
      if (!link || !title || title.length > MAX_TITLE_LENGTH || !(published > since && published <= now)) return [];
      return [{ title, link, source, published }];
    });
  } catch {
    logger.warn(`Could not read the feed ${feedUrl}`);
    return [];
  }
}

/** Links already in a post, so the next roundup doesn't repeat them */
function linksIn(post: { sections?: unknown } | null): Set<string> {
  const links = new Set<string>();
  if (!post || !Array.isArray(post.sections)) return links;
  for (const section of post.sections as { items?: { link?: unknown; text?: unknown; source?: unknown }[] }[]) {
    for (const item of section.items ?? []) {
      if (typeof item.link === 'string') {
        links.add(storyKey({ title: String(item.text ?? ''), link: item.link, source: '', published: 0 }).link);
      }
    }
  }
  return links;
}

/** The newest stories, without repeats, and no more than two from one publisher */
export function pickStories(stories: Story[], seenLinks: Set<string> = new Set()): Story[] {
  const picked: Story[] = [];
  const links = new Set(seenLinks);
  const titles = new Set<string>();
  const perSource = new Map<string, number>();
  for (const story of [...stories].sort((a, b) => b.published - a.published)) {
    const key = storyKey(story);
    if (links.has(key.link) || titles.has(key.title)) continue;
    if ((perSource.get(story.source) ?? 0) >= MAX_PER_SOURCE) continue;
    links.add(key.link);
    titles.add(key.title);
    perSource.set(story.source, (perSource.get(story.source) ?? 0) + 1);
    picked.push(story);
    if (picked.length === MAX_STORIES) break;
  }
  return picked;
}

/** Words that come up in more than one headline, most common first */
export function sharedThemes(stories: Story[], max = 3): string[] {
  const counts = new Map<string, { count: number; shown: string }>();
  for (const story of stories) {
    const words = new Set(
      story.title.split(/[^\p{L}\p{N}+#.-]+/u)
        .map(word => word.replace(/^[.-]+|[.-]+$/g, ''))
        .filter(word => word.length > 2 && !STOP_WORDS.has(word.toLowerCase()) && !/^\d+$/.test(word)),
    );
    const seen = new Set<string>();
    for (const word of words) {
      const key = word.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const entry = counts.get(key);
      // Show the word as headlines most often write it (AI, not ai)
      counts.set(key, { count: (entry?.count ?? 0) + 1, shown: entry?.shown ?? word });
    }
  }
  return [...counts.values()]
    .filter(entry => entry.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, max)
    .map(entry => entry.shown);
}

/** "A", "A and B", "A, B and C" */
export function listOf(words: string[]): string {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** The roundup, written from `stories` (already picked); null if there are too few */
export function writeNewsPost(topic: NewsTopic, stories: Story[], dateLabel: string): PostDraft | null {
  if (stories.length < MIN_STORIES) return null;
  const label = postTopic(topic).label;
  const lower = label.toLowerCase();
  const sources = [...new Set(stories.map(story => story.source))];
  const themes = sharedThemes(stories);

  const items: PostItem[] = stories.map(story => ({
    text: story.title,
    link: story.link,
    source: story.source,
    at: Timestamp.fromMillis(story.published),
    atLabel: 'Published',
  }));

  const sourceText = sources.length > 4 ? `${sources.slice(0, 4).join(', ')} and ${sources.length - 4} more` : listOf(sources);
  const themeText = themes.length > 0 ? ` ${themes.length === 1 ? 'One word' : 'Words'} that came up more than once: ${listOf(themes)}.` : '';

  return {
    title: `${label} roundup for ${dateLabel}`,
    description: `${stories.length} new ${lower} stories from ${sourceText}, with a link to each.`,
    intro: `${INTROS[topic]} Here are ${stories.length} stories that came through our ${lower} feeds since the last roundup, from ${sourceText}.${themeText} The headlines are the publishers' own; follow each link to read the full story on their site.`,
    sections: [
      { heading: 'The stories', items },
      { heading: 'Keep going on w3Develops', items: RELATED[topic] },
    ],
    outro: 'Found a story worth talking about? Bring it to your study group, or start one on the topic.',
  };
}

export async function buildNewsPost(context: PostContext): Promise<PostDraft | null> {
  const topic = context.topic as NewsTopic;
  const feeds = feedsByTopic[topic];
  const since = context.since.getTime();
  const now = context.now.getTime();
  const stories = (await Promise.all(feeds.map(feed => readFeed(feed, since, now)))).flat();
  return writeNewsPost(topic, pickStories(stories, linksIn(context.previous)), context.dateLabel);
}
