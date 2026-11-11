// Tells members when someone @mentions them in a feed post or reply. Mentions
// are found like src/lib/mentions.ts on the site; keep the patterns in step.
import { logger } from 'firebase-functions';
import { getFirestore, type DocumentData } from 'firebase-admin/firestore';
import { excerpt, getMembers, writeFeed } from './feed.js';

const MENTION_PATTERN = /(^|[^A-Za-z0-9_@.])@([A-Za-z0-9]{3,24})(?![A-Za-z0-9_])/g;
/** Most members one post or reply can notify, so a list of names can't spam */
const MAX_MENTIONS = 10;

/** The lowercase usernames mentioned in some text */
export function mentionedNames(text: unknown): Set<string> {
  if (typeof text !== 'string') return new Set();
  return new Set([...text.matchAll(MENTION_PATTERN)].map(match => match[2].toLowerCase()));
}

interface MentionSource {
  /** The post, and the reply when it's a reply */
  postId: string;
  replyId?: string;
  /** The post or reply now and before this change */
  after: DocumentData;
  before?: DocumentData;
  /** The post the mention is in, or replies to (for who may see it) */
  post: DocumentData;
}

/**
 * Notifies members newly mentioned in a visible post or reply: on a new one,
 * everyone it mentions; on an edit, only names that weren't there before.
 * Skips the author, members who blocked the author, and, on a followers-only
 * post, anyone who can't see it. Never throws.
 */
export async function notifyMentions(eventId: string, { postId, replyId, after, before, post }: MentionSource) {
  try {
    if (after.status !== 'visible' || post.status !== 'visible') return;
    const previous = mentionedNames(before?.text);
    const names = [...mentionedNames(after.text)].filter(name => !previous.has(name)).slice(0, MAX_MENTIONS);
    if (names.length === 0) return;

    const db = getFirestore();
    const claims = await db.getAll(...names.map(name => db.collection('usernames').doc(name)));
    const authorId: string = after.authorId;
    let ids = [...new Set(claims.map(claim => claim.get('uid')).filter((id): id is string => typeof id === 'string' && id !== authorId))];
    if (ids.length === 0) return;

    if (post.audience === 'followers') {
      const followers = new Set((await db.collection('users').doc(post.authorId).get()).get('followers') ?? []);
      ids = ids.filter(id => id === post.authorId || followers.has(id));
    }
    const prefs = ids.length ? await db.getAll(...ids.map(id => db.collection('users').doc(id).collection('private').doc('feedPrefs'))) : [];
    const blockedAuthor = new Set(prefs.filter(pref => (pref.get('blockedIds') ?? []).includes(authorId)).map(pref => pref.ref.parent.parent!.id));
    ids = ids.filter(id => !blockedAuthor.has(id));
    if (ids.length === 0) return;

    const members = await getMembers([authorId]);
    const name = members.get(authorId)?.username ?? 'A member';
    await writeFeed(eventId, ids.map(id => ({
      recipientId: id,
      type: 'mention' as const,
      actorId: authorId,
      notify: true,
      category: 'mentions' as const,
      message: `${name} mentioned you in a ${replyId ? 'reply' : 'post'}`,
      detail: excerpt(after.text),
      link: `/feed/${postId}`,
      key: `mention-${replyId ?? postId}-${id}`,
    })), members);
  } catch (error) {
    logger.error('Could not notify mentions', { postId, replyId, error: String(error) });
  }
}
