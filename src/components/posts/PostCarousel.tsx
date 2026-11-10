'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BlogPostCard from '@/components/posts/BlogPostCard';
import type { PostView } from '@/lib/post-view';

/**
 * The latest posts, side by side, scrolled with the arrows, a swipe or the
 * keyboard. The cards are ordinary links, so the server's HTML lists them all.
 */
export default function PostCarousel({ posts }: { posts: PostView[] }) {
  const track = useRef<HTMLUListElement>(null);
  if (posts.length === 0) return null;

  const scrollBy = (direction: 1 | -1) => {
    const list = track.current;
    if (!list) return;
    const card = list.querySelector('li');
    list.scrollBy({ left: direction * ((card?.clientWidth ?? list.clientWidth) + 16), behavior: 'smooth' });
  };

  return (
    <section aria-labelledby="latest-posts" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="latest-posts" className="text-2xl font-bold font-headline flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-primary" aria-hidden="true" />
          From w3Develops
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => scrollBy(-1)} aria-label="Previous posts">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => scrollBy(1)} aria-label="Next posts">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button asChild variant="link" className="px-1">
            <Link href="/news/archive">All posts</Link>
          </Button>
        </div>
      </div>
      <ul
        ref={track}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:thin]"
        tabIndex={0}
        aria-label="Latest posts"
      >
        {posts.map(post => (
          <li key={post.id} className="snap-start shrink-0 w-[85%] sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.7rem)]">
            <BlogPostCard post={post} />
          </li>
        ))}
      </ul>
    </section>
  );
}
