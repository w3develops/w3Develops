import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Markdown from '@/components/articles/Markdown';
import { readDoc } from '@/lib/server-db';
import { toPlain } from '@/firebase/firestore/plain';
import { sharePreview, SITE_NAME } from '@/lib/site-pages';
import { ARTICLE_TOPICS } from '@/lib/articles';

export const revalidate = 300;

type Props = { params: Promise<{ articleId: string }> };

interface PublishedArticle {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  title: string;
  summary: string;
  body: string;
  topic: keyof typeof ARTICLE_TOPICS;
  /** Plain from the server cache: { __timestamp: milliseconds } */
  publishedAt?: { __timestamp?: number };
}

// Only published articles; the Admin SDK skips the rules, which keep drafts private
const fetchArticle = unstable_cache(
  async (articleId: string) => {
    const article = await readDoc('articles', articleId);
    if (!article || article.data.status !== 'published') return null;
    const { body, title, summary, topic, authorId, authorName, authorPhoto, publishedAt } = article.data;
    return toPlain({ id: article.id, body, title, summary, topic, authorId, authorName, authorPhoto, publishedAt }) as unknown as PublishedArticle;
  },
  ['published-article'],
  { revalidate: 300, tags: ['articles'] },
);

async function getArticle(articleId: string) {
  try {
    return await fetchArticle(articleId);
  } catch {
    return null;
  }
}

function publishedMillis(value: PublishedArticle['publishedAt']): number | null {
  return typeof value?.__timestamp === 'number' ? value.__timestamp : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle((await params).articleId);
  if (!article) return { title: 'Article', robots: { index: false } };
  const path = `/news/articles/${article.id}`;
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: path },
    ...sharePreview(`${article.title} | ${SITE_NAME}`, article.summary, path),
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticle((await params).articleId);
  if (!article) notFound();
  const published = publishedMillis(article.publishedAt);

  return (
    <article className="max-w-3xl mx-auto p-4 md:p-10 space-y-6">
      <Link href="/news" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> News
      </Link>
      <header className="space-y-3">
        <Badge variant="secondary">{ARTICLE_TOPICS[article.topic] ?? article.topic}</Badge>
        <h1 className="text-3xl font-headline md:text-4xl">{article.title}</h1>
        <p className="text-lg text-muted-foreground">{article.summary}</p>
        <div className="flex items-center gap-2 text-sm">
          <Avatar className="h-8 w-8">
            <AvatarImage src={article.authorPhoto || undefined} alt="" />
            <AvatarFallback>{article.authorName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Link href={`/users/${article.authorId}`} className="font-medium hover:underline">{article.authorName}</Link>
          {published !== null && (
            <span className="text-muted-foreground">
              {/* A date only, so UTC is close enough and the server can render it */}
              · {new Date(published).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          )}
        </div>
      </header>
      <Markdown text={article.body} />
      <footer className="border-t pt-4 text-sm text-muted-foreground">
        Written by a w3Develops member. Want to write too? <Link href="/news/write" className="underline">Apply to write for w3Develops</Link>.
      </footer>
    </article>
  );
}
