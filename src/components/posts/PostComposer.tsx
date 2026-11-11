'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Timestamp, collection, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { ImagePlus, X } from 'lucide-react';
import { useFirebaseApp, useFirestore, useUser } from '@/firebase';
import { appStorage } from '@/firebase/initialize-app';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import ZonedText from '@/components/ZonedText';
import AppealButton from './AppealButton';
import PostFields, { AudienceSelect, EMPTY_DRAFT, draftFields, draftProblem, type PostDraft } from './PostFields';
import { needsEmailVerification } from '@/lib/hooks/useVerifiedGuard';
import { useNow } from '@/lib/hooks/useClientValues';
import { IMAGE_TYPES, MAX_IMAGE_BYTES, POSTS_PER_HOUR } from '@/lib/member-posts';
import { formatTimestamp } from '@/lib/utils';
import type { MemberStanding, PostAudience, UserProfile } from '@/lib/types';

const HOUR_MS = 60 * 60 * 1000;
// Only start a new hourly window once it's surely over by the server's
// clock too; adding to the current one is always accepted
const CLOCK_MARGIN_MS = 2 * 60 * 1000;

function millis(value: unknown): number | null {
  return value && typeof (value as Timestamp).toMillis === 'function' ? (value as Timestamp).toMillis() : null;
}

const EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };

/** Why an image can't be used, or null when it can */
export function imageProblem(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'Images can be JPEG, PNG, GIF or WebP.';
  if (file.size > MAX_IMAGE_BYTES) return 'Images can be up to 5 MB.';
  return null;
}

interface PostComposerProps {
  profile: UserProfile | null;
  standing: MemberStanding | null;
  /** Private accounts post to followers only */
  privateAccount: boolean;
}

/**
 * The form for a new post, or why the member can't post. firestore.rules
 * and storage.rules check the same things; this explains them first.
 */
export default function PostComposer({ profile, standing, privateAccount }: PostComposerProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const { toast } = useToast();
  const now = useNow();
  const fileInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<PostDraft>(EMPTY_DRAFT);
  const [chosenAudience, setChosenAudience] = useState<PostAudience>('public');
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const audience: PostAudience = privateAccount ? 'followers' : chosenAudience;

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
  const suspendedUntil = standing?.suspendedUntil ? millis(standing.suspendedUntil) : null;
  if (suspendedUntil !== null && suspendedUntil > now) {
    return notice(
      <>Moderators have paused your posting and replies until{' '}
        <ZonedText render={tz => formatTimestamp(standing!.suspendedUntil as Timestamp, true, tz)} />.{' '}
        {standing?.suspendLogId ? (
          <span className="mt-2 block"><AppealButton logId={standing.suspendLogId} action="suspend" /></span>
        ) : (
          <>To appeal, email{' '}
            <a href="mailto:w3DevelopsSupport@googlegroups.com" className="text-primary underline">w3DevelopsSupport@googlegroups.com</a>.</>
        )}</>,
    );
  }

  const problem = draftProblem(draft);

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    const issue = imageProblem(file);
    if (issue) {
      toast({ variant: 'destructive', title: "Can't use that image", description: issue });
      return;
    }
    if (image) URL.revokeObjectURL(image.preview);
    setImage({ file, preview: URL.createObjectURL(file) });
  };

  const clearImage = () => {
    if (image) URL.revokeObjectURL(image.preview);
    setImage(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  const post = async () => {
    if (problem) {
      toast({ variant: 'destructive', title: "Can't post that yet", description: problem });
      return;
    }
    setIsPosting(true);
    const postRef = doc(collection(firestore, 'memberPosts'));
    let uploadedPath: string | null = null;
    try {
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

      // The image goes up first, into this post's own folder (storage.rules)
      let imageFields = {};
      if (image) {
        uploadedPath = `memberPosts/${user.uid}/${postRef.id}/image.${EXTENSIONS[image.file.type]}`;
        const imageRef = ref(appStorage(app), uploadedPath);
        await uploadBytes(imageRef, image.file, { contentType: image.file.type });
        imageFields = { imagePath: uploadedPath, imageUrl: await getDownloadURL(imageRef) };
      }

      const batch = writeBatch(firestore);
      batch.set(postRef, {
        authorId: user.uid,
        authorName: profile.username,
        authorPhoto: profile.profilePictureUrl ?? '',
        ...draftFields(draft),
        audience,
        ...imageFields,
        status: 'visible',
        createdAt: serverTimestamp(),
      });
      batch.set(limitsRef, count);
      await batch.commit();
      uploadedPath = null;
      setDraft(EMPTY_DRAFT);
      clearImage();
      toast({ title: audience === 'followers' ? 'Posted for your followers' : 'Posted' });
    } catch {
      toast({ variant: 'destructive', title: "Couldn't post", description: 'Please try again in a minute.' });
    } finally {
      // Don't leave an image behind if the post itself wasn't saved
      if (uploadedPath) deleteObject(ref(appStorage(app), uploadedPath)).catch(() => {});
      setIsPosting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <PostFields draft={draft} onChange={setDraft} idPrefix="new-post" />
        {image && (
          <div className="relative w-fit">
            {/* A local preview of the chosen file, so next/image doesn't apply */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.preview} alt="The image you chose" className="max-h-48 rounded-md border" />
            <Button type="button" size="icon" variant="secondary" className="absolute right-1 top-1 h-7 w-7" onClick={clearImage} aria-label="Remove the image">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <input ref={fileInput} type="file" accept={IMAGE_TYPES.join(',')} className="hidden" id="new-post-image"
              onChange={e => pickImage(e.target.files?.[0])} />
            <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
              <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" /> {image ? 'Change image' : 'Add image'}
            </Button>
            <AudienceSelect value={audience} onChange={setChosenAudience} locked={privateAccount} idPrefix="new-post" />
          </div>
          <Button onClick={post} disabled={isPosting || !draft.text.trim()}>
            {isPosting ? 'Posting...' : 'Post'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {audience === 'public' ? 'Anyone can see this post.' : 'Only your followers can see this post.'}{' '}
          Mention someone with @username. Follow the <Link href="/code-of-conduct" className="underline">Code of Conduct</Link>.
        </p>
      </CardContent>
    </Card>
  );
}
