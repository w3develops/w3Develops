import { readFileSync } from 'node:fs';
import path from 'node:path';

// The PGP-signed canary statement. It lives in src/content, not public:
// reading a file from public/ at runtime makes the build trace that one file
// into public/, and App Hosting then skips copying the rest of public/
// (robots.txt, security.txt...). /warrant-canary.txt serves it.
export function readCanary() {
  const signed = readFileSync(path.join(process.cwd(), 'src/content/warrant-canary.txt'), 'utf8');
  const field = (name: string) => signed.match(new RegExp(`^${name}: (.+)$`, 'm'))?.[1] ?? '';
  return { signed, lastUpdated: field('Last updated'), nextUpdate: field('Next update') };
}
