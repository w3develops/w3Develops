// The docs at /docs: Markdown pages in src/content/docs, listed in
// src/content/docs/menu.json. Server code only (it reads files).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import menu from '@/content/docs/menu.json';

export interface DocMenuGroup { group: string; pages: string[] }
export interface DocMenuTab { tab: string; groups: DocMenuGroup[] }
export interface DocPage { slug: string; title: string; description: string; body: string }

export const DOCS_MENU = menu as DocMenuTab[];

/** Every page's slug, in menu order, like "index" or "guides/study-groups" */
export const DOC_SLUGS = DOCS_MENU.flatMap(tab => tab.groups.flatMap(group => group.pages));

/** A page's title and description from its front matter, plus its Markdown */
export function readDoc(slug: string): DocPage | null {
  if (!DOC_SLUGS.includes(slug)) return null;
  const source = readFileSync(path.join(process.cwd(), 'src/content/docs', `${slug}.md`), 'utf8');
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  const field = (name: string) => match[1].match(new RegExp(`^${name}: (.*)$`, 'm'))?.[1].trim() ?? '';
  return { slug, title: field('title'), description: field('description'), body: match[2] };
}

/** The address of a page: /docs for the index, /docs/<slug> otherwise */
export function docHref(slug: string): string {
  return slug === 'index' ? '/docs' : `/docs/${slug}`;
}
