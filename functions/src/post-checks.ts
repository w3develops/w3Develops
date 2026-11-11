import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore, type DocumentData } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Runs whenever a community feed post (memberPosts) is created, changed or
// deleted:
// - checks new or changed text with Cloud Natural Language moderateText, and
//   new images with Cloud Vision SafeSearch, and hides the post until a
//   moderator looks if either flags it;
// - deletes image files once their post or image is gone;
// - refreshes the cached /feed page when a post leaves the public feed, so
//   search engines don't keep seeing it.

/** How sure Natural Language must be, per category, before a post is hidden */
const TEXT_LIMITS: Record<string, number> = {
  Toxic: 0.75,
  Insult: 0.8,
  Derogatory: 0.75,
  Profanity: 0.85,
  Sexual: 0.7,
  Violent: 0.8,
  'Illicit Drugs': 0.8,
};
/** SafeSearch likelihoods that hide a post */
const FLAGGED_LIKELIHOODS = new Set(['LIKELY', 'VERY_LIKELY']);
const IMAGE_CATEGORIES = ['adult', 'violence', 'racy'] as const;

const SITE_URL = 'https://w3develops.org';
const inEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

async function googleToken(): Promise<string> {
  const { access_token: token } = await applicationDefault().getAccessToken();
  return token;
}

async function callGoogle(url: string, body: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await googleToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${url} answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return response.json() as Promise<Record<string, unknown>>;
}

/** The text categories over their limits, like ["Toxic 0.91"] */
async function flagText(text: string): Promise<string[]> {
  const result = await callGoogle('https://language.googleapis.com/v2/documents:moderateText', {
    document: { type: 'PLAIN_TEXT', content: text },
  });
  const categories = (result.moderationCategories ?? []) as { name: string; confidence: number }[];
  return categories
    .filter(category => TEXT_LIMITS[category.name] !== undefined && category.confidence >= TEXT_LIMITS[category.name])
    .map(category => `${category.name} ${category.confidence.toFixed(2)}`);
}

/** The image categories SafeSearch thinks are likely, like ["adult LIKELY"] */
async function flagImage(imagePath: string): Promise<string[]> {
  const bucket = getStorage().bucket().name;
  const result = await callGoogle('https://vision.googleapis.com/v1/images:annotate', {
    requests: [{ image: { source: { imageUri: `gs://${bucket}/${imagePath}` } }, features: [{ type: 'SAFE_SEARCH_DETECTION' }] }],
  });
  const response = ((result.responses ?? []) as { safeSearchAnnotation?: Record<string, string>; error?: { message: string } }[])[0];
  if (response?.error) throw new Error(response.error.message);
  const annotation = response?.safeSearchAnnotation ?? {};
  return IMAGE_CATEGORIES.filter(category => FLAGGED_LIKELIHOODS.has(annotation[category])).map(category => `${category} ${annotation[category]}`);
}

/** Hides a visible post after an automatic check, with a moderationLog entry */
async function hideAfterCheck(postId: string, flags: string[]) {
  const db = getFirestore();
  const postRef = db.doc(`memberPosts/${postId}`);
  await db.runTransaction(async transaction => {
    const post = await transaction.get(postRef);
    if (!post.exists || post.get('status') !== 'visible') return;
    const logRef = db.collection('moderationLog').doc();
    transaction.set(logRef, {
      actorId: 'system',
      action: 'auto-hide',
      targetUserId: post.get('authorId'),
      postId,
      note: `Automatic check flagged it: ${flags.join(', ')}`,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.update(postRef, { status: 'hidden', hiddenBy: 'auto-check', moderationLogId: logRef.id });
  });
  logger.warn('Post hidden by automatic check', { event: 'post_auto_checked', postId, flags });
}

/** Runs the checks this change needs; never throws, so a check failing never blocks posting */
async function checkPost(postId: string, before: DocumentData | undefined, after: DocumentData) {
  if (after.status !== 'visible') return;
  const textChanged = after.text !== before?.text;
  const newImage = typeof after.imagePath === 'string' && after.imagePath !== before?.imagePath;
  if (!textChanged && !newImage) return;
  if (inEmulator) {
    logger.info('Skipping automatic checks in the emulator', { postId });
    return;
  }
  const flags: string[] = [];
  try {
    if (textChanged && typeof after.text === 'string') flags.push(...(await flagText(after.text)));
  } catch (error) {
    logger.error('Text check failed', { postId, error: String(error) });
  }
  try {
    if (newImage) flags.push(...(await flagImage(after.imagePath)));
  } catch (error) {
    logger.error('Image check failed', { postId, error: String(error) });
  }
  if (flags.length > 0) await hideAfterCheck(postId, flags);
}

/** Deletes a post's image files that it no longer uses */
async function cleanUpImages(postId: string, before: DocumentData | undefined, after: DocumentData | undefined) {
  const oldPath = before?.imagePath;
  if (typeof oldPath !== 'string' || oldPath === after?.imagePath) return;
  try {
    if (!after) {
      // The whole post is gone: remove everything in its folder
      await getStorage().bucket().deleteFiles({ prefix: `memberPosts/${before?.authorId}/${postId}/` });
    } else {
      await getStorage().bucket().file(oldPath).delete({ ignoreNotFound: true });
    }
  } catch (error) {
    logger.error('Could not delete a post image', { postId, error: String(error) });
  }
}

const isPublic = (post: DocumentData | undefined) => post?.status === 'visible' && post?.audience === 'public';

/** Asks the site to rebuild its cached /feed page (src/app/api/revalidate/feed/route.ts) */
async function refreshFeedPage(postId: string) {
  if (inEmulator) return;
  try {
    const response = await fetch(`${SITE_URL}/api/revalidate/feed`, { method: 'POST' });
    if (!response.ok && response.status !== 429) logger.warn('Feed refresh answered', { status: response.status, postId });
  } catch (error) {
    logger.warn('Could not refresh the feed page', { postId, error: String(error) });
  }
}

export const onMemberPostWritten = onDocumentWritten({ document: 'memberPosts/{postId}', memory: '512MiB' }, async event => {
  const { postId } = event.params;
  const before = event.data?.before.exists ? event.data.before.data() : undefined;
  const after = event.data?.after.exists ? event.data.after.data() : undefined;

  await cleanUpImages(postId, before, after);
  if (after) await checkPost(postId, before, after);
  // A post that was on the public feed and isn't any more: hidden, deleted,
  // or switched to followers only
  if (isPublic(before) && !isPublic(after)) await refreshFeedPage(postId);
});
