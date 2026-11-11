// @mentions in feed posts and replies. A mention is "@" and a username (3 to
// 24 letters and numbers, as at signup) not stuck to a word or email address
// before it. functions/src/mentions.ts finds them the same way to notify the
// members; keep the two patterns in step.
export const MENTION_PATTERN = /(^|[^A-Za-z0-9_@.])@([A-Za-z0-9]{3,24})(?![A-Za-z0-9_])/g;

/** The text split into plain parts and mentions, in order */
export function splitMentions(text: string): ({ text: string } | { username: string })[] {
  const parts: ({ text: string } | { username: string })[] = [];
  let last = 0;
  for (const match of text.matchAll(MENTION_PATTERN)) {
    const start = match.index + match[1].length;
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ username: match[2] });
    last = start + 1 + match[2].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
