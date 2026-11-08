// Server code only: the first page of items for each public list page, so
// search engines, AI crawlers and visitors get real content in the HTML. The
// browser components show these until their live queries answer.
import { ONE_WEEK_IN_MS } from '@/lib/constants';
import { GROUP_KINDS, type GroupKind } from '@/lib/groups';
import { getPublicList, roundedNow } from '@/lib/public-items';

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

/**
 * New and in-progress groups, split at one week old the same way the browser
 * does it (see useOneWeekAgo); null when Firestore can't be read.
 */
export async function getInitialGroups(kind: GroupKind) {
  const config = GROUP_KINDS[kind];
  const cutoff = Math.floor((Date.now() - ONE_WEEK_IN_MS) / ONE_HOUR_IN_MS) * ONE_HOUR_IN_MS;
  const [newGroups, inProgress] = await Promise.all([
    getPublicList({ collection: config.collection, orderBy: 'createdAt', direction: 'desc', limit: 25, after: { field: 'createdAt', op: '>', millis: cutoff } }),
    getPublicList({ collection: config.collection, orderBy: 'createdAt', direction: 'desc', limit: 50, after: { field: 'createdAt', op: '<=', millis: cutoff } }),
  ]);
  return newGroups && inProgress ? { newGroups, inProgress } : null;
}

/** Upcoming and past meetups, as of a few minutes ago */
export async function getInitialMeetups() {
  const now = roundedNow();
  const [upcoming, past] = await Promise.all([
    getPublicList({ collection: 'meetups', orderBy: 'dateTime', direction: 'asc', limit: 50, after: { field: 'dateTime', op: '>=', millis: now } }),
    getPublicList({ collection: 'meetups', orderBy: 'dateTime', direction: 'desc', limit: 10, after: { field: 'dateTime', op: '<', millis: now } }),
  ]);
  return upcoming && past ? { upcoming, past } : null;
}
