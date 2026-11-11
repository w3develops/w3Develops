import { Fragment, type ReactNode } from 'react';

// A small, safe Markdown renderer for member articles: headings (## and ###),
// paragraphs, bullet and numbered lists, block quotes, fenced code blocks,
// and inline `code`, **bold**, *italic* and [links](https://...). It builds
// React elements and never inserts HTML, so nothing an author writes can run
// as script. Only https links are made clickable.

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\(https:\/\/[^)\s]+\))/g;

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    const key = parts.length;
    if (token.startsWith('`')) parts.push(<code key={key} className="rounded bg-muted px-1 py-0.5 text-sm">{token.slice(1, -1)}</code>);
    else if (token.startsWith('**')) parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith('*')) parts.push(<em key={key}>{token.slice(1, -1)}</em>);
    else {
      const [, label, href] = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!;
      parts.push(<a key={key} href={href} target="_blank" rel="nofollow ugc noopener noreferrer" className="text-primary underline">{label}</a>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const key = blocks.length;
    if (line.startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
      i++;
      blocks.push(<pre key={key} className="overflow-x-auto rounded-md bg-muted p-3 text-sm"><code>{code.join('\n')}</code></pre>);
    } else if (/^###\s/.test(line)) {
      blocks.push(<h3 key={key} className="mt-6 text-lg font-semibold">{inline(line.slice(4))}</h3>);
      i++;
    } else if (/^##?\s/.test(line)) {
      blocks.push(<h2 key={key} className="mt-8 text-xl font-semibold">{inline(line.replace(/^##?\s/, ''))}</h2>);
      i++;
    } else if (/^\s*[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s/, ''));
      blocks.push(<ul key={key} className="list-disc space-y-1 pl-6">{items.map((item, j) => <li key={j}>{inline(item)}</li>)}</ul>);
    } else if (/^\s*\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s/, ''));
      blocks.push(<ol key={key} className="list-decimal space-y-1 pl-6">{items.map((item, j) => <li key={j}>{inline(item)}</li>)}</ol>);
    } else if (line.startsWith('>')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) quote.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push(<blockquote key={key} className="border-l-4 pl-4 italic text-muted-foreground">{inline(quote.join(' '))}</blockquote>);
    } else if (!line.trim()) {
      i++;
    } else {
      const paragraph: string[] = [];
      while (i < lines.length && lines[i].trim() && !/^(```|#{2,3}\s|\s*[-*]\s|\s*\d+\.\s|>)/.test(lines[i])) paragraph.push(lines[i++]);
      blocks.push(<p key={key}>{paragraph.map((part, j) => <Fragment key={j}>{j > 0 && ' '}{inline(part)}</Fragment>)}</p>);
    }
  }
  return <div className="space-y-4 leading-relaxed">{blocks}</div>;
}
