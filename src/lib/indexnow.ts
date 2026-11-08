// IndexNow tells Bing, Yandex, Seznam, Naver and other search engines that a
// page is new or changed, so they crawl it within minutes instead of days.
// The key isn't a secret: search engines check it against the copy served at
// https://w3develops.org/a0025711ac571bdf68b7c9ba7194063a.txt, which proves the site sent the list.
import { SITE_URL } from '@/lib/site-pages';

export const INDEXNOW_KEY = 'a0025711ac571bdf68b7c9ba7194063a';

/** Sends pages on this site to IndexNow. Never throws; returns whether it was accepted. */
export async function submitToIndexNow(paths: string[]): Promise<boolean> {
  if (paths.length === 0) return true;
  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: paths.map(path => `${SITE_URL}${path}`),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) console.warn(`IndexNow refused the list: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.warn('Could not reach IndexNow:', error);
    return false;
  }
}
