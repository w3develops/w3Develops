import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import JsonLd from '@/components/JsonLd';
import PostActions from '@/components/posts/PostActions';
import PostTime from '@/components/posts/PostTime';
import { postTopic } from '@/lib/post-topics';
import { getPost } from '@/lib/posts';
import { SITE_NAME, SITE_URL, sharePreview } from '@/lib/site-pages';

type Props = { params: Promise<{ postId: string }> };

// Posts don't change once published; rendered on the server on first visit
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPost(postId);
  if (!post) return { title: 'Post', robots: { index: false } };
  const path = `/news/posts/${post.id}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: path },
    ...sharePreview(`${post.title} | ${SITE_NAME}`, post.description, path),
  };
}

export default async function PostPage({ params }: Props) {
  const { postId } = await params;
  const post = await getPost(postId);
  if (!post) notFound();
  const topic = postTopic(post.topic);
  const url = `${SITE_URL}/news/posts/${post.id}`;

  return (
    <article className="max-w-3xl mx-auto p-4 md:p-10 space-y-8">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        datePublished: new Date(post.createdAt).toISOString(),
        url,
        mainEntityOfPage: url,
        articleSection: topic.label,
        author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      }} />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/news" className="gap-2"><ArrowLeft className="h-4 w-4" /> News</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/news/archive?topic=${post.topic}`}>More {topic.label.toLowerCase()}</Link>
        </Button>
      </div>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{topic.label}</Badge>
          {post.aiWritten && <Badge variant="outline">Written with AI</Badge>}
        </div>
        <h1 className="text-3xl md:text-4xl font-headline font-bold leading-tight">{post.title}</h1>
        <p className="text-sm text-muted-foreground">
          By {SITE_NAME} · <PostTime ms={post.createdAt} withTime />
        </p>
      </header>

      {post.intro && <p className="text-lg leading-relaxed">{post.intro}</p>}

      {post.sections.map((section, index) => (
        <section key={index} className="space-y-3">
          {section.heading && <h2 className="text-xl font-bold font-headline">{section.heading}</h2>}
          <ul className="space-y-3">
            {section.items.map((item, itemIndex) => (
              <li key={itemIndex} className="border-l-4 border-primary/40 pl-4 py-1">
                {item.link ? (
                  item.external ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-primary underline-offset-2 hover:underline">
                      {item.text}
                      <ExternalLink className="inline h-3.5 w-3.5 ml-1 align-baseline" aria-label="(opens on another site)" />
                    </a>
                  ) : (
                    <Link href={item.link} className="font-semibold hover:text-primary underline-offset-2 hover:underline">{item.text}</Link>
                  )
                ) : (
                  <span className="font-semibold">{item.text}</span>
                )}
                {(item.source || item.detail || item.at !== undefined) && (
                  <p className="text-sm text-muted-foreground">
                    {[item.source, item.detail].filter(Boolean).join(' · ')}
                    {item.at !== undefined && (
                      <>
                        {(item.source || item.detail) && ' · '}
                        {item.atLabel && `${item.atLabel} `}<PostTime ms={item.at} withTime />
                      </>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {post.outro && <p className="leading-relaxed">{post.outro}</p>}

      <footer className="pt-6 border-t space-y-4">
        <PostActions title={post.title} url={url} />
        <p className="text-xs text-muted-foreground">
          {post.aiWritten
            ? 'Parts of this post were written with an AI model.'
            : post.topic === 'community'
              ? 'Written automatically from what\'s public on w3Develops.'
              : 'Written automatically from our news feeds. Headlines belong to their publishers; follow the links for the full stories.'}
        </p>
      </footer>
    </article>
  );
}
