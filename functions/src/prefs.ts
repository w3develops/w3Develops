// Which notifications each member wants, from users/{uid}/private/
// notificationPrefs. Same names and defaults as src/lib/notification-prefs.ts
// on the site; keep them in step.
import { getFirestore } from 'firebase-admin/firestore';

export const PREF_DEFAULTS = {
  follows: true,
  groupMembers: true,
  groupActivity: true,
  requests: true,
  following: true,
  meetingReminders: false,
  replies: true,
  mentions: true,
};
export type PrefId = keyof typeof PREF_DEFAULTS;

/** For each member, whether each kind of notification is on */
export async function getPrefs(userIds: string[]): Promise<Map<string, Record<PrefId, boolean>>> {
  const unique = [...new Set(userIds)];
  const prefs = new Map<string, Record<PrefId, boolean>>();
  if (unique.length === 0) return prefs;
  const db = getFirestore();
  const snaps = await db.getAll(...unique.map(id => db.collection('users').doc(id).collection('private').doc('notificationPrefs')));
  for (const snap of snaps) {
    const data = snap.data() ?? {};
    const merged = { ...PREF_DEFAULTS };
    for (const key of Object.keys(PREF_DEFAULTS) as PrefId[]) {
      if (typeof data[key] === 'boolean') merged[key] = data[key];
    }
    prefs.set(snap.ref.parent.parent!.id, merged);
  }
  return prefs;
}
