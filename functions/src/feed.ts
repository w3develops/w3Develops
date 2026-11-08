// Writing entries into members' activity feeds (users/{uid}/feed). Each entry
// shows in the member's activity feed; entries with `notify` also show in
// their notification bell until read. Only this server code can write them.
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

/** Entries delete themselves after this long (a Firestore TTL policy on expiresAt) */
const KEEP_DAYS = 60;

export type FeedType = 'follow' | 'group_join' | 'group_leave';

export interface FeedEntry {
  /** The member whose feed it goes in */
  recipientId: string;
  type: FeedType;
  /** Who did it */
  actorId: string;
  message: string;
  /** Where clicking the entry goes, a path on the site */
  link: string;
  /** Show it in the bell, not just the activity feed */
  notify: boolean;
}

export interface Member {
  id: string;
  username: string;
  photo: string;
}

/** Usernames and pictures for some members, in one read */
export async function getMembers(ids: string[]): Promise<Map<string, Member>> {
  const unique = [...new Set(ids)];
  const members = new Map<string, Member>();
  if (unique.length === 0) return members;
  const db = getFirestore();
  const snaps = await db.getAll(...unique.map(id => db.collection('users').doc(id)));
  for (const snap of snaps) {
    const data = snap.data() ?? {};
    members.set(snap.id, {
      id: snap.id,
      username: typeof data.username === 'string' && data.username ? data.username : 'A member',
      photo: typeof data.profilePictureUrl === 'string' ? data.profilePictureUrl : '',
    });
  }
  return members;
}

/**
 * Saves feed entries. `eventId` is the triggering event's ID: entries are
 * named after it, so if the function runs twice for one event (Cloud
 * Functions may retry), the same entries are written again, not doubled.
 */
export async function writeFeed(eventId: string, entries: FeedEntry[], members: Map<string, Member>): Promise<void> {
  if (entries.length === 0) return;
  const db = getFirestore();
  const expiresAt = Timestamp.fromMillis(Date.now() + KEEP_DAYS * 24 * 60 * 60 * 1000);
  for (let i = 0; i < entries.length; i += 400) {
    const batch = db.batch();
    for (const entry of entries.slice(i, i + 400)) {
      const actor = members.get(entry.actorId);
      const ref = db.collection('users').doc(entry.recipientId).collection('feed')
        .doc(`${eventId}-${entry.type}-${entry.actorId}`.slice(0, 1500));
      batch.set(ref, {
        type: entry.type,
        actorId: entry.actorId,
        actorName: actor?.username ?? 'A member',
        actorPhoto: actor?.photo ?? '',
        message: entry.message,
        link: entry.link,
        notify: entry.notify,
        read: !entry.notify,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt,
      });
    }
    await batch.commit();
  }
}

/** IDs in `after` that weren't in `before` */
export function added(before: unknown, after: unknown): string[] {
  const old = new Set(Array.isArray(before) ? before : []);
  return (Array.isArray(after) ? after : []).filter((id): id is string => typeof id === 'string' && !old.has(id));
}
