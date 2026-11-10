import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import PostTime from '@/components/posts/PostTime';
import { postTopic } from '@/lib/post-topics';
import type { PostView } from '@/lib/post-view';

/** A post's topic, title, date and summary, linking to the post */
export default function BlogPostCard({ post, className = '' }: { post: PostView; className?: string }) {
  return (
    <Card className={`h-full hover:shadow-md transition-all border-t-4 border-t-primary ${className}`}>
      <CardContent className="p-5 flex flex-col gap-3 h-full">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{postTopic(post.topic).label}</Badge>
          {post.aiWritten && <Badge variant="outline">Written with AI</Badge>}
        </div>
        <Link href={`/news/posts/${post.id}`} className="text-lg font-bold font-headline leading-snug hover:text-primary transition-colors">
          {post.title}
        </Link>
        {post.description && <p className="text-sm text-muted-foreground line-clamp-3">{post.description}</p>}
        <p className="text-xs text-muted-foreground mt-auto"><PostTime ms={post.createdAt} /></p>
      </CardContent>
    </Card>
  );
}
