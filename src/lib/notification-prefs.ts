// The kinds of notification members can switch on or off, stored privately
// in users/{uid}/private/notificationPrefs. The server copy of this list is
// in functions/src/prefs.ts, and firestore.rules checks the same field
// names; keep all three in step.

export const NOTIFICATION_PREFS = [
  { id: 'follows', label: 'New followers', description: 'When someone follows you.', default: true },
  { id: 'groupMembers', label: 'Group members', description: 'When someone joins or leaves your study groups, projects or book clubs.', default: true },
  { id: 'groupActivity', label: 'Group check-ins and tasks', description: 'When members of your groups post check-ins, or add or finish tasks.', default: true },
  { id: 'requests', label: 'Mentorship, tutoring and pairing', description: 'When someone sends you a request, or accepts yours.', default: true },
  { id: 'following', label: 'People you follow', description: 'When someone you follow joins a group or starts a solo project.', default: true },
  { id: 'replies', label: 'Replies to your posts', description: 'When someone replies to one of your posts on the community feed.', default: true },
  { id: 'mentions', label: 'Mentions', description: 'When someone mentions you with @username in a feed post or reply.', default: true },
  { id: 'messages', label: 'Messages', description: 'When someone sends you a direct message.', default: true },
  { id: 'meetingReminders', label: 'Meeting reminders', description: 'About 30 minutes before your groups meet, for groups with a set time.', default: false },
] as const;

export type NotificationPrefId = (typeof NOTIFICATION_PREFS)[number]['id'];
export type NotificationPrefs = Partial<Record<NotificationPrefId, boolean>>;

export function prefIsOn(prefs: NotificationPrefs | null | undefined, id: NotificationPrefId): boolean {
  return prefs?.[id] ?? NOTIFICATION_PREFS.find(pref => pref.id === id)!.default;
}
