// w3Develops' scheduled posts. At each news refresh time (1am, 4am, 7am,
// 10am, 1pm, 4pm, 7pm and 10pm Pacific) one topic gets its daily post: the
// community insights at 1am, written from the site's own public data, and a
// news roundup from that topic's RSS feeds the rest of the day (see
// src/lib/post-topics.ts). A topic with nothing new is skipped rather than
// filled with old news. Posts go in the `posts` collection, which members can
// read but only this code can write.
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue, Timestamp, type DocumentData } from 'firebase-admin/firestore';
import { POST_TOPICS, postTopic, type PostTopic } from './shared/post-topics.js';
import { buildCommunityPost } from './community-post.js';
import { buildNewsPost } from './news-post.js';

export const POSTS_TIME_ZONE = 'America/Los_Angeles';

/**
 * Off by default. Turning it on would let a post be summarized by an AI model,
 * which costs money: ask the site's owner and set a monthly budget first.
 * Nothing calls a model yet; posts that ever do must set aiWritten: true.
 */
export const AI_SUMMARIES_ENABLED = false;

export interface PostItem {
  text: string;
  link?: string;
  source?: string;
  detail?: string;
  at?: Timestamp;
  atLabel?: string;
}

export interface PostSection {
  heading: string;
  items: PostItem[];
}

/** A post's content, before the scheduler adds its topic, times and ID */
export interface PostDraft {
  title: string;
  description: string;
  intro: string;
  sections: PostSection[];
  outro?: string;
}

/** What a post builder gets to work with */
export interface PostContext {
  topic: PostTopic;
  now: Date;
  /** Show only what's new since this time: the topic's last post, or a day ago */
  since: Date;
  /** The topic's last post, if there was one in the last week */
  previous: DocumentData | null;
  /** The day the post is for, like "November 9, 2026" */
  dateLabel: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const LOOK_BACK_DAYS = 7;

function pacificParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: POSTS_TIME_ZONE, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) };
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** The ID of a topic's post on a Pacific date, like "2026-11-09-crypto" */
export const postId = (date: string, topic: PostTopic) => `${date}-${topic}`;

/** The topic due at `when`, a run's scheduled time (on the hour) */
export function topicAt(when: Date): { topic: PostTopic; date: string } | null {
  const { date, hour } = pacificParts(when);
  const topic = POST_TOPICS.find(t => t.hour === hour);
  return topic ? { topic: topic.id, date } : null;
}

/** Writes the post for `topic` on `date`, unless it's already there or there's nothing new */
export async function publishTopic(topic: PostTopic, date: string, now: Date): Promise<'published' | 'exists' | 'skipped'> {
  const db = getFirestore();
  const posts = db.collection('posts');
  const ref = posts.doc(postId(date, topic));
  if ((await ref.get()).exists) return 'exists';

  // The topic's last post in the past week, found by ID so no index is needed
  const earlier = Array.from({ length: LOOK_BACK_DAYS }, (_, i) => posts.doc(postId(addDays(date, -(i + 1)), topic)));
  const previous = (await db.getAll(...earlier)).find(snap => snap.exists)?.data() ?? null;
  const previousAt = previous?.createdAt instanceof Timestamp ? previous.createdAt.toMillis() : 0;
  const since = new Date(Math.max(previousAt, now.getTime() - DAY_MS));

  const [y, m, d] = date.split('-').map(Number);
  const dateLabel = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
  const context: PostContext = { topic, now, since, previous, dateLabel };

  const draft = topic === 'community' ? await buildCommunityPost(context) : await buildNewsPost(context);
  if (!draft) {
    logger.info(`No ${postTopic(topic).label.toLowerCase()} post today: nothing new since the last one`, { date, since: since.toISOString() });
    return 'skipped';
  }

  try {
    // create() fails if a retry or an overlapping run already wrote it
    await ref.create({
      ...draft,
      topic,
      aiWritten: false,
      editionId: new Date(Math.floor(now.getTime() / 3_600_000) * 3_600_000).toISOString(),
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    if ((error as { code?: number }).code === 6) return 'exists'; // ALREADY_EXISTS
    throw error;
  }
  logger.info(`Published ${ref.id}`, { title: draft.title });
  return 'published';
}

export const scheduledPosts = onSchedule({
  // The news refresh times in src/lib/news-schedule.ts
  schedule: `0 ${POST_TOPICS.map(t => t.hour).join(',')} * * *`,
  timeZone: POSTS_TIME_ZONE,
  timeoutSeconds: 300,
  memory: '512MiB',
  retryCount: 1,
}, async event => {
  const now = new Date();
  const slot = topicAt(new Date(event.scheduleTime || now));
  if (!slot) {
    logger.warn('No post topic for this run', { scheduleTime: event.scheduleTime });
    return;
  }
  await publishTopic(slot.topic, slot.date, now);
});
