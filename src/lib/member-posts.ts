// Limits and filters for member posts (the /feed page). Several of these are
// repeated in firestore.rules, which enforces them; keep the two in step.

/** Longest post, in characters (firestore.rules: isValidPostContent) */
export const MAX_POST_LENGTH = 500;
/** Most topics on one post (firestore.rules: isValidPostContent) */
export const MAX_POST_TOPICS = 3;
/** A topic is 1 to 30 lowercase letters, numbers and dashes, like "react" or "career-change" */
export const TOPIC_PATTERN = /^[a-z0-9-]{1,30}$/;
/** Most posts per member per hour (firestore.rules: match /postLimits) */
export const POSTS_PER_HOUR = 5;
/** How old an account must be before it can post (firestore.rules: isOldEnoughToPost) */
export const MIN_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1000;
/** Open reports from different members that hide a post until a moderator looks (functions/src/reports.ts) */
export const AUTO_HIDE_REPORTS = 3;
/** Most topics a member can follow, which is also Firestore's limit for one array-contains-any query */
export const MAX_FOLLOWED_TOPICS = 30;

/**
 * Words a post can't contain, matched as whole words in any case. The same
 * list is in firestore.rules (hasBlockedWord), which refuses the post; this
 * copy lets the form explain why before sending. The rules tests check every
 * word here is refused, so add new words to both.
 */
export const BLOCKED_WORDS = [
  'fuck', 'fucking', 'fucker', 'motherfucker', 'shit', 'bullshit', 'cunt', 'bitch', 'whore', 'slut',
  'porn', 'porno', 'nudes', 'onlyfans', 'xxx',
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'kys',
  'free robux', 'free vbucks',
];

/** The first blocked word in the text, or null */
export function findBlockedWord(text: string): string | null {
  const lower = text.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    const pattern = new RegExp(`(^|[^a-z0-9_])${word.replace(/ /g, '\\s+')}([^a-z0-9_]|$)`);
    if (pattern.test(lower)) return word;
  }
  return null;
}

/** Turns "React, career change, #JS" into ["react", "career-change", "js"]; drops ones that don't fit */
export function parseTopics(input: string): string[] {
  const topics = input
    .split(',')
    .map(topic => topic.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '-'))
    .filter(topic => TOPIC_PATTERN.test(topic));
  return [...new Set(topics)];
}

export const POST_REPORT_REASONS = {
  spam: 'Spam or scams',
  harassment: 'Harassment or bullying',
  'off-topic': 'Off-topic',
  unsafe: 'Unsafe or inappropriate content',
} as const;
export type PostReportReason = keyof typeof POST_REPORT_REASONS;

/** What a moderator did; stored on each moderationLog entry */
export const MODERATION_ACTIONS = {
  hide: 'Hid a post',
  restore: 'Restored a post',
  delete: 'Deleted a post',
  dismiss: 'Dismissed reports',
  warn: 'Warned a member',
  suspend: 'Suspended a member',
  unsuspend: 'Lifted a suspension',
  'auto-hide': 'Hid a post after reports',
  'add-moderator': 'Made a member a moderator',
  'remove-moderator': 'Removed a moderator',
  'edit-content': 'Edited',
  'delete-content': 'Deleted',
} as const;
export type ModerationAction = keyof typeof MODERATION_ACTIONS;

/** Suspension lengths a moderator can pick, in days */
export const SUSPENSION_DAYS = [1, 7, 30] as const;
