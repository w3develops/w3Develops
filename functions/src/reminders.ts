import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFeed, type FeedEntry } from './feed.js';
import { GROUP_KINDS } from './groups.js';
import { getPrefs } from './prefs.js';
import { isValidTimeZone, meetingsAround } from './time.js';

// "Your group meets in 30 minutes", for members who switched meeting
// reminders on (they're off by default). Runs every 5 minutes and picks the
// meetings starting 25 to 35 minutes from now. Each reminder is named after
// the group and meeting time, so overlapping runs never send it twice.

const RUN_EVERY_MINUTES = 5;
const LEAD_MINUTES = 30;

export const meetingReminders = onSchedule({ schedule: `every ${RUN_EVERY_MINUTES} minutes`, timeZone: 'UTC' }, async () => {
  const db = getFirestore();
  const now = Date.now();
  const from = now + (LEAD_MINUTES - RUN_EVERY_MINUTES) * 60_000;
  const to = now + (LEAD_MINUTES + RUN_EVERY_MINUTES) * 60_000;

  for (const [collection, kind] of Object.entries(GROUP_KINDS)) {
    const groups = await db.collection(collection).select('name', 'memberIds', 'commitmentDays', 'startTime', 'timezone').get();
    for (const group of groups.docs) {
      const { name, memberIds, commitmentDays, startTime, timezone } = group.data();
      if (!Array.isArray(memberIds) || memberIds.length === 0 || !Array.isArray(commitmentDays)
        || typeof startTime !== 'string' || !isValidTimeZone(timezone)) continue;
      const start = meetingsAround(now, commitmentDays, startTime, timezone).find(t => t > from && t <= to);
      if (start === undefined) continue;

      const prefs = await getPrefs(memberIds);
      const groupName = typeof name === 'string' && name ? name : `Your ${kind.noun}`;
      const entries: FeedEntry[] = memberIds
        .filter((id): id is string => typeof id === 'string' && prefs.get(id)?.meetingReminders === true)
        .map(id => ({
          recipientId: id, type: 'reminder', actorId: group.id, actorName: groupName,
          notify: true, category: 'meetingReminders',
          message: `${groupName} meets in about ${LEAD_MINUTES} minutes`,
          link: `${kind.path}/${group.id}`,
        }));
      await writeFeed(`reminder-${group.id}-${start}`, entries, new Map());
    }
  }
});
