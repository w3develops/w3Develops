'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deleteDoc, deleteField, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { EyeOff, MoreHorizontal, ExternalLink } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import ReportUserButton from '@/components/ReportUserButton';
import ZonedText from '@/components/ZonedText';
import PostFields, { draftFields, draftProblem, type PostDraft } from './PostFields';
import { formatTimestamp } from '@/lib/utils';
import type { MemberPost } from '@/lib/types';

function linkLabel(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    return `${hostname.replace(/^www\./, '')}${pathname === '/' ? '' : pathname}`.slice(0, 60);
  } catch {
    return url.slice(0, 60);
  }
}

interface PostCardProps {
  post: MemberPost;
  /** Mute or block the author; left out for visitors and on the author's own posts */
  onMute?: (authorId: string) => void;
  onBlock?: (authorId: string) => void;
  /** Extra controls under the post, like a moderator's buttons */
  children?: React.ReactNode;
}

/** One post on the feed or the moderation page */
export default function PostCard({ post, onMute, onBlock, children }: PostCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingBlock, setIsConfirmingBlock] = useState(false);
  const [draft, setDraft] = useState<PostDraft>({ text: post.text, topics: post.topics.join(', '), linkUrl: post.linkUrl ?? '' });
  const [isSaving, setIsSaving] = useState(false);
  const isAuthor = user?.uid === post.authorId;

  const save = async () => {
    const problem = draftProblem(draft);
    if (problem) {
      toast({ variant: 'destructive', title: "Can't save that", description: problem });
      return;
    }
    setIsSaving(true);
    try {
      const fields = draftFields(draft);
      await updateDoc(doc(firestore, 'memberPosts', post.id), {
        ...fields,
        linkUrl: fields.linkUrl ?? deleteField(),
        updatedAt: serverTimestamp(),
      });
      setIsEditing(false);
    } catch {
      toast({ variant: 'destructive', title: "Couldn't save your changes", description: 'Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    setIsSaving(true);
    try {
      await deleteDoc(doc(firestore, 'memberPosts', post.id));
      setIsConfirmingDelete(false);
      toast({ title: 'Post deleted' });
    } catch {
      toast({ variant: 'destructive', title: "Couldn't delete the post", description: 'Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={post.status === 'hidden' ? 'border-dashed opacity-80' : undefined}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Link href={`/users/${post.authorId}`} aria-hidden="true" tabIndex={-1}>
            <Avatar className="h-9 w-9">
              <AvatarImage src={post.authorPhoto || undefined} alt="" />
              <AvatarFallback>{post.authorName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <Link href={`/users/${post.authorId}`} className="font-semibold hover:underline">{post.authorName}</Link>
              <span className="text-xs text-muted-foreground">
                <ZonedText render={tz => formatTimestamp(post.createdAt, true, tz)} />
                {post.updatedAt && ' · edited'}
              </span>
            </div>
            {post.status === 'hidden' && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <EyeOff className="h-3 w-3" aria-hidden="true" />
                {post.hiddenBy === 'reports' ? 'Hidden after reports, until a moderator reviews it.' : 'Hidden by a moderator.'}
                {isAuthor && ' Only you and moderators can see it.'}
              </p>
            )}
          </div>
          {user && !isAuthor && (onMute || onBlock) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`More options for ${post.authorName}'s post`}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onMute && <DropdownMenuItem onSelect={() => onMute(post.authorId)}>Mute {post.authorName}</DropdownMenuItem>}
                {onBlock && <DropdownMenuItem onSelect={() => setIsConfirmingBlock(true)}>Block {post.authorName}</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <p className="whitespace-pre-wrap break-words">{post.text}</p>

        {post.linkUrl && (
          <a href={post.linkUrl} target="_blank" rel="nofollow ugc noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline break-all">
            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" /> {linkLabel(post.linkUrl)}
          </a>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {post.topics.map(topic => <Badge key={topic} variant="secondary">#{topic}</Badge>)}
          </div>
          <div className="flex items-center gap-1">
            {isAuthor ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setIsConfirmingDelete(true)}>Delete</Button>
              </>
            ) : (
              <ReportUserButton reportedUserId={post.authorId} username={post.authorName} postId={post.id} />
            )}
          </div>
        </div>
        {children}
      </CardContent>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit post</DialogTitle>
            <DialogDescription>Your post will show as edited.</DialogDescription>
          </DialogHeader>
          <PostFields draft={draft} onChange={setDraft} idPrefix={`edit-${post.id}`} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={save} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this post?</DialogTitle>
            <DialogDescription>This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmingDelete(false)} disabled={isSaving}>Cancel</Button>
            <Button variant="destructive" onClick={remove} disabled={isSaving}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {onBlock && (
        <Dialog open={isConfirmingBlock} onOpenChange={setIsConfirmingBlock}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Block {post.authorName}?</DialogTitle>
              <DialogDescription>
                You won&apos;t see their posts, they&apos;ll be removed from your followers and can&apos;t follow you again,
                and you&apos;ll stop following them. They aren&apos;t told. You can unblock them from the feed&apos;s settings.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmingBlock(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => { setIsConfirmingBlock(false); onBlock(post.authorId); }}>Block</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
