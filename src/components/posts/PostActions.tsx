'use client';

import { useMemo } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useDoc, useFirestore, useUser } from '@/firebase';
import type { UserProfile } from '@/lib/types';

/**
 * Share links and a heart for a post. Hearts go in the member's
 * heartedArticleLinks, like hearts on the news page's headlines.
 */
export default function PostActions({ title, url }: { title: string; url: string }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const userRef = useMemo(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(userRef);
  const isHearted = profile?.heartedArticleLinks?.includes(url) ?? false;

  const shareLinks = [
    { name: 'X', href: `https://x.com/intent/post?text=${encodeURIComponent(`${title} (via @w3develops)`)}&url=${encodeURIComponent(url)}` },
    { name: 'Bluesky', href: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${title} ${url}`)}` },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { name: 'Hacker News', href: `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}` },
  ];

  const handleHeart = async () => {
    if (!userRef) {
      toast({ title: 'Sign in to heart posts', variant: 'destructive' });
      return;
    }
    try {
      await updateDoc(userRef, { heartedArticleLinks: isHearted ? arrayRemove(url) : arrayUnion(url) });
    } catch (error) {
      console.error('Could not save the heart:', error);
      toast({ title: "Couldn't save that. Please try again.", variant: 'destructive' });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied' });
    } catch {
      window.open(shareLinks[0].href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Button variant="ghost" size="sm" onClick={handleHeart} aria-pressed={isHearted} className={isHearted ? 'text-red-500' : 'text-muted-foreground'}>
        <Heart className={`h-4 w-4 mr-2 ${isHearted ? 'fill-current' : ''}`} aria-hidden="true" />
        {isHearted ? 'Hearted' : 'Heart'}
      </Button>
      <Button variant="ghost" size="sm" onClick={handleShare} className="text-muted-foreground">
        <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
        Share
      </Button>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span>Share on</span>
        {shareLinks.map(link => (
          <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-primary underline-offset-2 hover:underline">
            {link.name}
          </a>
        ))}
      </p>
    </div>
  );
}
