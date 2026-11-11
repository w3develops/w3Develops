import type { Metadata } from 'next';
import { getPublicMemberPost } from '@/lib/public-items';
import PostPage from './PostPage';

export const revalidate = 300;

type Props = { params: Promise<{ postId: string }> };

function shorten(text: string, max = 60): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

// A single feed post with its replies. Posts can be hidden or deleted at any
// time, so their pages stay out of search results; /feed itself is indexed.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPublicMemberPost(postId);
  const title = post && typeof post.text === 'string' && typeof post.authorName === 'string'
    ? `${post.authorName}: “${shorten(post.text)}”`
    : 'Community Feed post';
  return { title, robots: { index: false } };
}

export default async function FeedPostPage({ params }: Props) {
  const { postId } = await params;
  const initial = await getPublicMemberPost(postId);
  return <PostPage postId={postId} initial={initial} />;
}
