// Copies the site files the functions share (the post topics and the RSS
// feeds by topic) into functions/src/shared, so the functions build and
// deploy on their own. Runs before every build (npm run build, and so
// before every deploy); edit the files under src/lib, never the copies.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const functionsDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const siteLib = join(functionsDir, '..', 'src', 'lib');
const outDir = join(functionsDir, 'src', 'shared');
const FILES = ['post-topics.ts', 'rss-feeds.ts'];

mkdirSync(outDir, { recursive: true });
for (const file of FILES) {
  const source = readFileSync(join(siteLib, file), 'utf8');
  if (/^\s*import\s/m.test(source)) {
    throw new Error(`src/lib/${file} is shared with the functions, so it can't import anything`);
  }
  const banner = `// Copied from src/lib/${file} by functions/scripts/copy-shared.mjs; edit that file, not this one.\n\n`;
  writeFileSync(join(outDir, file), banner + source);
}
