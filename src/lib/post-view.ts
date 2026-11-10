// A scheduled post (BlogPost in src/lib/types.ts) in the plain form pages and
// browser components get: times as UTC milliseconds, and anything unexpected
// dropped, so a bad document can't break a page or slip in an unsafe link.
import { isPostTopic, type PostTopic } from '@/lib/post-topics';

export interface PostItemView {
  text: string;
  link?: string;
  external?: boolean;
  source?: string;
  detail?: string;
  at?: number;
  atLabel?: string;
}

export interface PostView {
  id: string;
  topic: PostTopic;
  title: string;
  description: string;
  intro: string;
  sections: { heading: string; items: PostItemView[] }[];
  outro?: string;
  aiWritten: boolean;
  createdAt: number;
}

const text = (value: unknown, max = 2000) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';

/** Plain Timestamps (from toPlain) or Timestamps, as milliseconds */
function millisOf(value: unknown): number | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const plain = (value as { __timestamp?: unknown }).__timestamp;
  if (typeof plain === 'number') return plain;
  const toMillis = (value as { toMillis?: unknown }).toMillis;
  return typeof toMillis === 'function' ? (toMillis as () => number).call(value) : undefined;
}

/** A path on this site, or an http(s) address; anything else is dropped */
function safeLink(value: unknown): { link: string; external: boolean } | null {
  const link = text(value, 2000);
  if (/^\/(?!\/)/.test(link)) return { link, external: false };
  try {
    const url = new URL(link);
    return url.protocol === 'https:' || url.protocol === 'http:' ? { link: url.toString(), external: true } : null;
  } catch {
    return null;
  }
}

function toItem(raw: unknown): PostItemView | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const itemText = text(item.text, 300);
  if (!itemText) return null;
  const link = safeLink(item.link);
  const at = millisOf(item.at);
  return {
    text: itemText,
    ...(link && link),
    ...(text(item.source, 100) && { source: text(item.source, 100) }),
    ...(text(item.detail, 200) && { detail: text(item.detail, 200) }),
    ...(at !== undefined && { at, atLabel: text(item.atLabel, 40) || undefined }),
  };
}

/** The post as a PostView, or null if it's missing what a page needs */
export function toPostView(raw: unknown): PostView | null {
  if (!raw || typeof raw !== 'object') return null;
  const post = raw as Record<string, unknown>;
  const id = text(post.id, 100);
  const title = text(post.title, 200);
  const createdAt = millisOf(post.createdAt);
  if (!id || !title || !isPostTopic(post.topic) || createdAt === undefined) return null;
  const sections = (Array.isArray(post.sections) ? post.sections : []).flatMap(section => {
    if (!section || typeof section !== 'object') return [];
    const { heading, items } = section as Record<string, unknown>;
    const views = (Array.isArray(items) ? items : []).map(toItem).filter((item): item is PostItemView => item !== null);
    return views.length > 0 ? [{ heading: text(heading, 120), items: views }] : [];
  });
  return {
    id,
    topic: post.topic,
    title,
    description: text(post.description, 400),
    intro: text(post.intro),
    sections,
    ...(text(post.outro) && { outro: text(post.outro) }),
    aiWritten: post.aiWritten === true,
    createdAt,
  };
}

export function toPostViews(list: unknown[] | null): PostView[] {
  return (list ?? []).map(toPostView).filter((post): post is PostView => post !== null);
}

/** "November 9, 2026" or "November 9, 2026, 4:00 PM", in `timeZone` */
export function formatPostTime(ms: number, timeZone: string, withTime = false): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
      ...(withTime && { timeStyle: 'short' }),
      timeZone,
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toISOString();
  }
}
