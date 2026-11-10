// The daily community insights post: what's happening on w3Develops, written
// from templates using the site's own data. Only what every visitor can
// already see on the site goes in: names, topics, member and entry counts,
// and times. Never member names, addresses or meeting links.
import { getFirestore, Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { GROUP_KINDS, type GroupCollection } from './groups.js';
import { listOf } from './news-post.js';
import type { PostContext, PostDraft, PostItem, PostSection } from './posts.js';

const DAY_MS = 24 * 60 * 60 * 1000;
/** "Starting soon" and "upcoming" look this far ahead */
const AHEAD_DAYS = 7;
/** Something this close makes the post worth writing even when nothing is new */
const SOON_MS = 2 * DAY_MS;
const MAX_PER_SECTION = 8;
const MAX_NAME_LENGTH = 120;

interface Found {
  key: string;
  item: PostItem;
  /** When it happens, for sorting and for "is it soon" */
  when?: number;
}

const millis = (value: unknown) => (value instanceof Timestamp ? value.toMillis() : null);
const nameOf = (data: Record<string, unknown>) => {
  const name = typeof data.name === 'string' ? data.name.replace(/\s+/g, ' ').trim() : '';
  return name.slice(0, MAX_NAME_LENGTH);
};
const count = (value: unknown) => (Array.isArray(value) ? value.length : 0);
const plural = (n: number, word: string, words = `${word}s`) => `${n} ${n === 1 ? word : words}`;

// What each kind of thing is called, by collection
const NOUNS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(GROUP_KINDS).map(([collection, kind]) => [collection, kind.noun])),
  meetups: 'meetup',
  competitions: 'competition',
};
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function groupDetail(collection: GroupCollection, data: Record<string, unknown>): string {
  const topic = typeof data.topic === 'string' && data.topic.trim() ? ` · ${data.topic.trim().slice(0, 60)}` : '';
  return `${capitalize(GROUP_KINDS[collection].noun)}${topic} · ${plural(count(data.memberIds), 'member')}`;
}

export interface CommunityData {
  newItems: Found[];
  startingSoon: Found[];
  meetups: Found[];
  competitions: Found[];
  totals: { collection: GroupCollection; count: number }[];
}

async function readCommunity(now: number, since: number): Promise<CommunityData> {
  const db = getFirestore();
  const ahead = now + AHEAD_DAYS * DAY_MS;
  const newItems: Found[] = [];
  const startingSoon: Found[] = [];
  const totals: CommunityData['totals'] = [];

  for (const [collection, kind] of Object.entries(GROUP_KINDS) as [GroupCollection, (typeof GROUP_KINDS)[GroupCollection]][]) {
    const groups = db.collection(collection);
    const [created, starting, total] = await Promise.all([
      groups.where('createdAt', '>', Timestamp.fromMillis(since)).orderBy('createdAt', 'desc').limit(MAX_PER_SECTION).get(),
      groups.where('startDate', '>=', Timestamp.fromMillis(now)).where('startDate', '<=', Timestamp.fromMillis(ahead))
        .orderBy('startDate').limit(MAX_PER_SECTION).get(),
      groups.count().get(),
    ]);
    totals.push({ collection, count: total.data().count });
    const add = (list: Found[], doc: QueryDocumentSnapshot, when?: number) => {
      const data = doc.data();
      const name = nameOf(data);
      if (!name) return;
      const start = millis(data.startDate);
      list.push({
        key: `${collection}/${doc.id}`,
        when,
        item: {
          text: name,
          link: `${kind.path}/${doc.id}`,
          detail: groupDetail(collection, data),
          ...(start !== null && start > now && { at: Timestamp.fromMillis(start), atLabel: 'First meeting' }),
        },
      });
    };
    created.docs.forEach(doc => add(newItems, doc, millis(doc.data().createdAt) ?? undefined));
    starting.docs.forEach(doc => add(startingSoon, doc, millis(doc.data().startDate) ?? undefined));
  }

  const meetups: Found[] = [];
  const meetupDocs = await db.collection('meetups')
    .where('dateTime', '>=', Timestamp.fromMillis(now)).where('dateTime', '<=', Timestamp.fromMillis(ahead))
    .orderBy('dateTime').limit(MAX_PER_SECTION).get();
  for (const doc of meetupDocs.docs) {
    const data = doc.data();
    const name = nameOf(data);
    const at = millis(data.dateTime);
    if (!name || at === null) continue;
    const where = ['Online', 'In-Person', 'Hybrid'].includes(data.locationType) ? `${data.locationType} meetup` : 'Meetup';
    meetups.push({
      key: `meetups/${doc.id}`, when: at,
      item: { text: name, link: `/meetups/${doc.id}`, detail: `${where} · ${count(data.attendeeIds)} going`, at: Timestamp.fromMillis(at), atLabel: 'Starts' },
    });
  }
  const newMeetups = await db.collection('meetups').where('createdAt', '>', Timestamp.fromMillis(since))
    .orderBy('createdAt', 'desc').limit(MAX_PER_SECTION).get();
  for (const doc of newMeetups.docs) {
    const data = doc.data();
    const name = nameOf(data);
    const at = millis(data.dateTime);
    if (!name || at === null || at < now) continue;
    newItems.push({
      key: `meetups/${doc.id}`, when: millis(data.createdAt) ?? undefined,
      item: { text: name, link: `/meetups/${doc.id}`, detail: 'Meetup', at: Timestamp.fromMillis(at), atLabel: 'Starts' },
    });
  }

  // Competitions and hackathons that are open now or open within the week
  const competitions: Found[] = [];
  const open = await db.collection('competitions').where('endDate', '>', Timestamp.fromMillis(now))
    .orderBy('endDate').limit(MAX_PER_SECTION * 2).get();
  for (const doc of open.docs) {
    const data = doc.data();
    const name = nameOf(data);
    const start = millis(data.startDate);
    const end = millis(data.endDate);
    if (!name || start === null || end === null || start > ahead) continue;
    const created = millis(data.createdAt);
    if (start > now) {
      competitions.push({
        key: `competitions/${doc.id}`, when: start,
        item: { text: name, link: `/competitions/${doc.id}`, detail: 'Competition · opens soon', at: Timestamp.fromMillis(start), atLabel: 'Opens' },
      });
    } else {
      const entries = (await doc.ref.collection('entries').count().get()).data().count;
      competitions.push({
        key: `competitions/${doc.id}`, when: end,
        item: { text: name, link: `/competitions/${doc.id}`, detail: `Competition · ${plural(entries, 'entry', 'entries')} so far`, at: Timestamp.fromMillis(end), atLabel: 'Entries close' },
      });
    }
    if (created !== null && created > since) {
      newItems.push({
        key: `competitions/${doc.id}`, when: created,
        item: { text: name, link: `/competitions/${doc.id}`, detail: 'Competition', at: Timestamp.fromMillis(end), atLabel: 'Entries close' },
      });
    }
    if (competitions.length >= MAX_PER_SECTION) break;
  }

  return { newItems, startingSoon, meetups, competitions, totals };
}

/** The post, written from what was found; null if there's nothing new or coming up soon */
export function writeCommunityPost(data: CommunityData, now: number, dateLabel: string): PostDraft | null {
  const newKeys = new Set(data.newItems.map(found => found.key));
  // Something new is listed once, under "New on w3Develops"
  const notNew = (list: Found[]) => list.filter(found => !newKeys.has(found.key));
  const startingSoon = notNew(data.startingSoon);
  const meetups = notNew(data.meetups);
  const competitions = notNew(data.competitions);

  const soon = (list: Found[]) => list.some(found => found.when !== undefined && found.when - now <= SOON_MS);
  if (data.newItems.length === 0 && !soon(startingSoon) && !soon(meetups) && !soon(competitions)) return null;

  const byNewest = [...data.newItems].sort((a, b) => (b.when ?? 0) - (a.when ?? 0));
  const byTime = (list: Found[]) => [...list].sort((a, b) => (a.when ?? 0) - (b.when ?? 0));
  const sections: PostSection[] = [
    { heading: 'New on w3Develops', items: byNewest.map(found => found.item) },
    { heading: 'Starting this week', items: byTime(startingSoon).map(found => found.item) },
    { heading: 'Upcoming meetups', items: byTime(meetups).map(found => found.item) },
    { heading: 'Competitions and hackathons', items: byTime(competitions).map(found => found.item) },
  ]
    .map(section => ({ ...section, items: section.items.slice(0, MAX_PER_SECTION) }))
    .filter(section => section.items.length > 0);

  // "2 new study groups, 1 new meetup", in the order of NOUNS
  const newCounts = new Map<string, number>();
  for (const found of data.newItems) {
    const collection = found.key.split('/')[0];
    newCounts.set(collection, (newCounts.get(collection) ?? 0) + 1);
  }
  const highlights = [
    ...Object.keys(NOUNS).filter(c => newCounts.has(c)).map(c => plural(newCounts.get(c)!, `new ${NOUNS[c]}`)),
    startingSoon.length > 0 && `${plural(startingSoon.length, 'group', 'groups')} starting this week`,
    meetups.length > 0 && plural(meetups.length, 'upcoming meetup'),
    competitions.length > 0 && `${plural(competitions.length, 'competition')} open or opening soon`,
  ].filter((text): text is string => !!text);
  const summary = listOf(highlights);

  const totals = data.totals
    .filter(total => total.count > 0)
    .map(total => plural(total.count, GROUP_KINDS[total.collection].noun));
  const totalText = totals.length > 0 ? ` Across the site there are ${listOf(totals)}.` : '';

  return {
    title: `Community insights for ${dateLabel}`,
    description: `What's happening on w3Develops: ${summary}.`,
    intro: `Here's what's happening on w3Develops: ${summary}.${totalText} Times are shown in your own time zone.`,
    sections: [
      ...sections,
      {
        heading: 'Get involved',
        items: [
          { text: 'Start or join a study group', link: '/studygroups' },
          { text: 'Host a meetup', link: '/meetups' },
          { text: 'Enter a competition', link: '/competitions' },
        ],
      },
    ],
    outro: 'Everything here is free to join. See you there!',
  };
}

export async function buildCommunityPost(context: PostContext): Promise<PostDraft | null> {
  const now = context.now.getTime();
  // Anything created since the last community post (or in the last day)
  const data = await readCommunity(now, context.since.getTime());
  return writeCommunityPost(data, now, context.dateLabel);
}
