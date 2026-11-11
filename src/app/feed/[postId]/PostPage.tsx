'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
import PostCard from '@/components/posts/PostCard';
import type { MemberPost } from '@/lib/types';

/** One feed post with its replies open; `initial` is the server's copy of a public post */
export default function PostPage({ postId, initial }: { postId: string; initial: Record<string, unknown> | null }) {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();
  const ref = useMemo(() => doc(firestore, 'memberPosts', postId), [firestore, postId]);
  const { data: post, isLoading, error } = useDoc<MemberPost>(ref, initial);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-10 space-y-4">
      <Link href="/feed" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Community Feed
      </Link>
      {post ? (
        <PostCard post={post} repliesOpen />
      ) : isLoading || isUserLoading ? (
        <p className="text-muted-foreground">Loading post...</p>
      ) : (
        <p className="text-muted-foreground">
          {error ? 'This post is for the author’s followers, or was removed.' : 'This post was removed.'}
        </p>
      )}
    </div>
  );
}
