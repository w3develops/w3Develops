import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BlogPostCard from '@/components/posts/BlogPostCard';
import { POST_TOPICS, isPostTopic, postTopic } from '@/lib/post-topics';
import { getArchivePage } from '@/lib/posts';
import { pageMetadata } from '@/lib/site-pages';

export const metadata: Metadata = pageMetadata('/news/archive');

type Props = { searchParams: Promise<{ topic?: string | string[]; before?: string | string[] }> };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function archiveHref(topic?: string, before?: number) {
  const params = new URLSearchParams();
  if (topic) params.set('topic', topic);
  if (before !== undefined) params.set('before', String(before));
  const query = params.toString();
  return query ? `/news/archive?${query}` : '/news/archive';
}

export default async function NewsArchivePage({ searchParams }: Props) {
  const params = await searchParams;
  const topicParam = first(params.topic);
  const topic = isPostTopic(topicParam) ? topicParam : undefined;
  const beforeParam = Number(first(params.before));
  const before = Number.isFinite(beforeParam) && beforeParam > 0 ? Math.floor(beforeParam) : undefined;
  const page = await getArchivePage({ topic, before });
  const last = page?.posts[page.posts.length - 1];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-8">
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href="/news" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Latest News
          </Link>
        </Button>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">
          {topic ? `${postTopic(topic).label} posts` : 'News Archive'}
        </h1>
        <p className="text-muted-foreground text-lg">
          {topic
            ? postTopic(topic).blurb
            : 'Every w3Develops post: community insights each night, and a daily roundup for each news topic.'}
        </p>
      </div>

      <nav aria-label="Filter by topic" className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant={topic ? 'outline' : 'default'}>
          <Link href="/news/archive" aria-current={topic ? undefined : 'page'}>All topics</Link>
        </Button>
        {POST_TOPICS.map(t => (
          <Button key={t.id} asChild size="sm" variant={topic === t.id ? 'default' : 'outline'}>
            <Link href={archiveHref(t.id)} aria-current={topic === t.id ? 'page' : undefined}>{t.label}</Link>
          </Button>
        ))}
      </nav>

      {!page ? (
        <p className="text-center text-muted-foreground py-12">The posts couldn&apos;t be loaded right now. Please try again in a few minutes.</p>
      ) : page.posts.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          {before ? 'No older posts.' : 'No posts yet. New posts go up eight times a day, so check back soon.'}
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {page.posts.map(post => (
            <li key={post.id}><BlogPostCard post={post} /></li>
          ))}
        </ul>
      )}

      {(before !== undefined || (page?.more && last)) && (
        <div className="flex items-center justify-center gap-4 pt-6 border-t">
          {before !== undefined && (
            <Button asChild variant="outline" size="sm"><Link href={archiveHref(topic)}>Newest posts</Link></Button>
          )}
          {page?.more && last && (
            <Button asChild variant="outline" size="sm"><Link href={archiveHref(topic, last.createdAt)}>Older posts</Link></Button>
          )}
        </div>
      )}
    </div>
  );
}
