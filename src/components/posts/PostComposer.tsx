'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Timestamp, collection, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import ZonedText from '@/components/ZonedText';
import PostFields, { EMPTY_DRAFT, draftFields, draftProblem, type PostDraft } from './PostFields';
import { needsEmailVerification } from '@/lib/hooks/useVerifiedGuard';
import { useNow } from '@/lib/hooks/useClientValues';
import { MIN_ACCOUNT_AGE_MS, POSTS_PER_HOUR } from '@/lib/member-posts';
import { formatTimestamp } from '@/lib/utils';
import type { MemberStanding, UserProfile } from '@/lib/types';

const HOUR_MS = 60 * 60 * 1000;
// Only start a new hourly window once it's surely over by the server's
// clock too; adding to the current one is always accepted
const CLOCK_MARGIN_MS = 2 * 60 * 1000;

function millis(value: unknown): number | null {
  return value && typeof (value as Timestamp).toMillis === 'function' ? (value as Timestamp).toMillis() : null;
}

/**
 * The form for a new post, or why the member can't post yet. firestore.rules
 * checks the same things (canCreatePost); this explains them first.
 */
export default function PostComposer({ profile, standing }: { profile: UserProfile | null; standing: MemberStanding | null }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const now = useNow();
  const [draft, setDraft] = useState<PostDraft>(EMPTY_DRAFT);
  const [isPosting, setIsPosting] = useState(false);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          <Link href="/login?redirect=/feed" className="text-primary underline">Sign in</Link> or{' '}
          <Link href="/signup" className="text-primary underline">join w3Develops</Link> to post.
        </CardContent>
      </Card>
    );
  }
  if (!profile || now === null) return null;

  const notice = (message: React.ReactNode) => (
    <Card><CardContent className="p-4 text-sm text-muted-foreground">{message}</CardContent></Card>
  );

  if (needsEmailVerification(user)) {
    return notice('Verify your email to start posting. You can resend the link from the banner at the top of the page.');
  }
  const createdAt = millis(profile.createdAt);
  if (createdAt === null) {
    return notice('Your account needs a moment to finish setting up before you can post.');
  }
  if (now - createdAt < MIN_ACCOUNT_AGE_MS) {
    const allowedAt = createdAt + MIN_ACCOUNT_AGE_MS;
    return notice(
      <>New accounts can post after their first day. You can post from{' '}
        <ZonedText render={tz => formatTimestamp(Timestamp.fromMillis(allowedAt), true, tz)} />.</>,
    );
  }
  const suspendedUntil = standing?.suspendedUntil ? millis(standing.suspendedUntil) : null;
  if (suspendedUntil !== null && suspendedUntil > now) {
    return notice(
      <>Moderators have paused your posting until{' '}
        <ZonedText render={tz => formatTimestamp(standing!.suspendedUntil as Timestamp, true, tz)} />. To appeal, email{' '}
        <a href="mailto:w3DevelopsSupport@googlegroups.com" className="text-primary underline">w3DevelopsSupport@googlegroups.com</a>.</>,
    );
  }

  const problem = draftProblem(draft);

  const post = async () => {
    if (problem) {
      toast({ variant: 'destructive', title: "Can't post that yet", description: problem });
      return;
    }
    setIsPosting(true);
    try {
      const postRef = doc(collection(firestore, 'memberPosts'));
      const limitsRef = doc(firestore, 'postLimits', user.uid);
      // Each post is counted in the same save (match /postLimits in firestore.rules)
      const limits = (await getDoc(limitsRef)).data();
      const windowStart = millis(limits?.windowStart);
      let count;
      if (!limits || windowStart === null || Date.now() - windowStart >= HOUR_MS + CLOCK_MARGIN_MS) {
        count = { windowStart: serverTimestamp(), count: 1, lastPostId: postRef.id };
      } else if (limits.count >= POSTS_PER_HOUR) {
        toast({ variant: 'destructive', title: 'Slow down a little', description: `You can post up to ${POSTS_PER_HOUR} times an hour. Try again a bit later.` });
        return;
      } else {
        count = { windowStart: limits.windowStart, count: limits.count + 1, lastPostId: postRef.id };
      }
      const batch = writeBatch(firestore);
      batch.set(postRef, {
        authorId: user.uid,
        authorName: profile.username,
        authorPhoto: profile.profilePictureUrl ?? '',
        ...draftFields(draft),
        status: 'visible',
        createdAt: serverTimestamp(),
      });
      batch.set(limitsRef, count);
      await batch.commit();
      setDraft(EMPTY_DRAFT);
      toast({ title: 'Posted' });
    } catch {
      toast({ variant: 'destructive', title: "Couldn't post", description: 'Please try again in a minute.' });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <PostFields draft={draft} onChange={setDraft} idPrefix="new-post" />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Posts are public. Follow the <Link href="/code-of-conduct" className="underline">Code of Conduct</Link>.
          </p>
          <Button onClick={post} disabled={isPosting || !draft.text.trim()}>
            {isPosting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
