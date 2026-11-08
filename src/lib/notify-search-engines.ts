/**
 * Asks the server to tell search engines about a new or changed public page
 * (see src/app/api/indexnow/route.ts). Runs in the background; failures
 * don't matter, since the sitemap lists the page anyway.
 */
export function notifySearchEngines(path: string): void {
  fetch('/api/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
    keepalive: true,
  }).catch(() => {});
}
