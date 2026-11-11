'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Timestamp, collection, deleteDoc, doc, getDoc, increment, limit, orderBy, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { Heart, MessageCircle } from 'lucide-react';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import ReportUserButton from '@/components/ReportUserButton';
import ZonedText from '@/components/ZonedText';
import AppealButton from './AppealButton';
import { useVerifiedGuard } from '@/lib/hooks/useVerifiedGuard';
import { useIsModerator } from '@/lib/hooks/useIsModerator';
import { useModerationActions } from '@/app/moderation/useModerationActions';
import { MAX_REPLY_LENGTH, REPLIES_PER_HOUR, findBlockedWord } from '@/lib/member-posts';
import { formatTimestamp } from '@/lib/utils';
import type { MemberPost, PostReply } from '@/lib/types';

const SHOWN_REPLIES = 50;
const HOUR_MS = 60 * 60 * 1000;
// Only start a new hourly window once it's surely over by the server's clock too
const CLOCK_MARGIN_MS = 2 * 60 * 1000;

/**
 * A heart with the post's like count. A like is saved as
 * memberPosts/<postId>/likes/<uid> together with the count (firestore.rules:
 * isCountingLike), so the count can't drift.
 */
export function LikeButton({ post }: { post: MemberPost }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const ensureVerified = useVerifiedGuard();
  const { toast } = useToast();
  const [isWorking, setIsWorking] = useState(false);
  const likeRef = useMemo(() => (user ? doc(firestore, 'memberPosts', post.id, 'likes', user.uid) : null), [firestore, user, post.id]);
  const { data: like, isLoading } = useDoc<{ createdAt: Timestamp }>(likeRef);
  const count = post.likeCount ?? 0;
  const liked = !!like;

  const toggle = async () => {
    if (!user || !likeRef) {
      toast({ title: 'Sign in to like posts' });
      return;
    }
    if (!ensureVerified()) return;
    setIsWorking(true);
    try {
      const batch = writeBatch(firestore);
      const postRef = doc(firestore, 'memberPosts', post.id);
      if (liked) {
        batch.delete(likeRef);
        batch.update(postRef, { likeCount: increment(-1) });
      } else {
        batch.set(likeRef, { createdAt: serverTimestamp() });
        batch.update(postRef, { likeCount: increment(1) });
      }
      await batch.commit();
    } catch {
      toast({ variant: 'destructive', title: "Couldn't save your like", description: 'Please try again.' });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggle} disabled={isWorking || (!!user && isLoading)}
      aria-pressed={liked} aria-label={`${liked ? 'Unlike' : 'Like'} this post (${count} ${count === 1 ? 'like' : 'likes'})`}>
      <Heart className={`mr-1 h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} aria-hidden="true" /> {count}
    </Button>
  );
}

/** The button that opens a post's replies, with how many there are */
export function RepliesToggle({ post, open, onToggle }: { post: MemberPost; open: boolean; onToggle: () => void }) {
  const count = post.replyCount ?? 0;
  return (
    <Button variant="ghost" size="sm" onClick={onToggle} aria-expanded={open}
      aria-label={`${open ? 'Hide' : 'Show'} replies (${count})`}>
      <MessageCircle className="mr-1 h-4 w-4" aria-hidden="true" /> {count}
    </Button>
  );
}

function ReplyItem({ post, reply }: { post: MemberPost; reply: PostReply }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const isModerator = useIsModerator();
  const moderate = useModerationActions();
  const [isWorking, setIsWorking] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const isAuthor = user?.uid === reply.authorId;
  const isPostAuthor = user?.uid === post.authorId;

  const saveEdit = async () => {
    const text = (draft ?? '').trim();
    if (!text || text === reply.text) {
      setDraft(null);
      return;
    }
    const blocked = findBlockedWord(text);
    if (blocked) {
      toast({ variant: 'destructive', title: "Can't save that", description: `Replies can't include “${blocked}”. Please follow the Code of Conduct.` });
      return;
    }
    setIsWorking(true);
    try {
      await updateDoc(doc(firestore, 'memberPosts', post.id, 'replies', reply.id), { text, updatedAt: serverTimestamp() });
      setDraft(null);
    } catch {
      toast({ variant: 'destructive', title: "Couldn't save your reply", description: 'You may be paused from posting. Please try again later.' });
    } finally {
      setIsWorking(false);
    }
  };

  const remove = async (asModerator: boolean) => {
    setIsWorking(true);
    try {
      if (asModerator) {
        await moderate({ action: 'delete', targetUserId: reply.authorId, postId: post.id, replyId: reply.id, note: 'Removed from the thread' });
      } else {
        await deleteDoc(doc(firestore, 'memberPosts', post.id, 'replies', reply.id));
      }
      toast({ title: 'Reply removed' });
    } catch {
      toast({ variant: 'destructive', title: "Couldn't remove the reply", description: 'Please try again.' });
      setIsWorking(false);
    }
  };

  return (
    <li className="flex items-start gap-2">
      <Link href={`/users/${reply.authorId}`} aria-hidden="true" tabIndex={-1}>
        <Avatar className="h-7 w-7">
          <AvatarImage src={reply.authorPhoto || undefined} alt="" />
          <AvatarFallback>{reply.authorName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1 rounded-md bg-muted/50 px-3 py-2">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <Link href={`/users/${reply.authorId}`} className="text-sm font-semibold hover:underline">{reply.authorName}</Link>
          <span className="text-xs text-muted-foreground">
            <ZonedText render={tz => formatTimestamp(reply.createdAt, true, tz)} />
            {reply.updatedAt && ' · edited'}
          </span>
          {reply.status === 'hidden' && <span className="text-xs text-muted-foreground">· hidden, only you and moderators see it</span>}
        </div>
        {draft === null ? (
          <p className="whitespace-pre-wrap break-words text-sm">{reply.text}</p>
        ) : (
          <form className="mt-1 space-y-2" onSubmit={e => { e.preventDefault(); saveEdit(); }}>
            <Textarea value={draft} onChange={e => setDraft(e.target.value)} maxLength={MAX_REPLY_LENGTH} rows={2} aria-label="Edit your reply" autoFocus />
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="h-7 text-xs" disabled={isWorking || !draft.trim()}>{isWorking ? 'Saving...' : 'Save'}</Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDraft(null)} disabled={isWorking}>Cancel</Button>
            </div>
          </form>
        )}
        {reply.status === 'hidden' && isAuthor && reply.moderationLogId && (
          <div className="my-1">
            <AppealButton logId={reply.moderationLogId} action={reply.hiddenBy === 'moderator' ? 'hide' : 'auto-hide'} postId={post.id} replyId={reply.id} />
          </div>
        )}
        <div className="-ml-2 flex flex-wrap items-center">
          {isAuthor && draft === null && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDraft(reply.text)} disabled={isWorking}>Edit</Button>
          )}
          {(isAuthor || isPostAuthor) && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => remove(false)} disabled={isWorking}>
              {isAuthor ? 'Delete' : 'Remove'}
            </Button>
          )}
          {!isAuthor && !isPostAuthor && isModerator && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => remove(true)} disabled={isWorking}>
              Delete (moderator)
            </Button>
          )}
          {user && !isAuthor && (
            <ReportUserButton reportedUserId={reply.authorId} username={reply.authorName} postId={post.id} replyId={reply.id} />
          )}
        </div>
      </div>
    </li>
  );
}

function ReplyComposer({ post }: { post: MemberPost }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const ensureVerified = useVerifiedGuard();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href={`/login?redirect=/feed/${post.id}`} className="text-primary underline">Sign in</Link> to reply.
      </p>
    );
  }

  const send = async () => {
    const trimmed = text.trim();
    const blocked = findBlockedWord(trimmed);
    if (blocked) {
      toast({ variant: 'destructive', title: "Can't send that", description: `Replies can't include “${blocked}”. Please follow the Code of Conduct.` });
      return;
    }
    if (!ensureVerified()) return;
    setIsPosting(true);
    try {
      const replyRef = doc(collection(firestore, 'memberPosts', post.id, 'replies'));
      const limitsRef = doc(firestore, 'replyLimits', user.uid);
      const [limitsSnap, me] = await Promise.all([getDoc(limitsRef), getDoc(doc(firestore, 'users', user.uid))]);
      const limits = limitsSnap.data();
      const windowStart = limits?.windowStart instanceof Timestamp ? limits.windowStart.toMillis() : null;
      let count;
      if (!limits || windowStart === null || Date.now() - windowStart >= HOUR_MS + CLOCK_MARGIN_MS) {
        count = { windowStart: serverTimestamp(), count: 1, lastPostId: post.id, lastReplyId: replyRef.id };
      } else if (limits.count >= REPLIES_PER_HOUR) {
        toast({ variant: 'destructive', title: 'Slow down a little', description: `You can reply up to ${REPLIES_PER_HOUR} times an hour.` });
        return;
      } else {
        count = { windowStart: limits.windowStart, count: limits.count + 1, lastPostId: post.id, lastReplyId: replyRef.id };
      }
      const batch = writeBatch(firestore);
      batch.set(replyRef, {
        authorId: user.uid,
        authorName: me.data()?.username ?? '',
        authorPhoto: me.data()?.profilePictureUrl ?? '',
        text: trimmed,
        status: 'visible',
        createdAt: serverTimestamp(),
      });
      batch.set(limitsRef, count);
      await batch.commit();
      setText('');
    } catch {
      toast({ variant: 'destructive', title: "Couldn't send your reply", description: 'You may be paused from posting, or the post was removed.' });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <form className="flex items-end gap-2" onSubmit={e => { e.preventDefault(); send(); }}>
      <Textarea value={text} onChange={e => setText(e.target.value)} maxLength={MAX_REPLY_LENGTH} rows={1}
        placeholder="Write a reply" aria-label="Write a reply" className="min-h-9" />
      <Button type="submit" size="sm" disabled={isPosting || !text.trim()}>{isPosting ? 'Sending...' : 'Reply'}</Button>
    </form>
  );
}

/** A post's replies, oldest first, with a box to add one */
export function ReplyThread({ post }: { post: MemberPost }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const repliesQuery = useMemo(
    () => query(collection(firestore, 'memberPosts', post.id, 'replies'), where('status', '==', 'visible'), orderBy('createdAt', 'asc'), limit(SHOWN_REPLIES)),
    [firestore, post.id],
  );
  const { data: replies, isLoading } = useCollection<PostReply>(repliesQuery);
  // The member's own hidden replies, so they know what happened
  const ownHiddenQuery = useMemo(
    () => (user ? query(collection(firestore, 'memberPosts', post.id, 'replies'), where('authorId', '==', user.uid), where('status', '==', 'hidden')) : null),
    [firestore, post.id, user],
  );
  const { data: ownHidden } = useCollection<PostReply>(ownHiddenQuery);
  const shown = useMemo(
    () => [...(replies ?? []), ...(ownHidden ?? [])].sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0)),
    [replies, ownHidden],
  );

  return (
    <div className="space-y-3 border-t pt-3">
      {isLoading && !replies && <p className="text-sm text-muted-foreground">Loading replies...</p>}
      {replies && shown.length === 0 && <p className="text-sm text-muted-foreground">No replies yet.</p>}
      {shown.length > 0 && <ul className="space-y-2">{shown.map(reply => <ReplyItem key={reply.id} post={post} reply={reply} />)}</ul>}
      {post.status === 'visible' && <ReplyComposer post={post} />}
    </div>
  );
}
