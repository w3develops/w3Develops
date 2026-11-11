'use client';

import { useMemo, useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { MAX_APPEAL_LENGTH } from '@/lib/member-posts';
import type { Appeal } from '@/lib/types';

const WHAT: Record<Appeal['action'], string> = {
  hide: 'hiding your post',
  'auto-hide': 'hiding your post',
  'remove-image': "removing your post's image",
  warn: 'this warning',
  suspend: 'pausing your posting',
};

interface AppealButtonProps {
  /** The moderationLog entry for the action, which names the appeal */
  logId: string;
  action: Appeal['action'];
  postId?: string;
  /** With postId, the appeal is about this reply to the post */
  replyId?: string;
}

/**
 * Lets a member ask the moderators to look again at an action about them,
 * once per action (firestore.rules: match /appeals). Once sent, it shows
 * where the appeal stands, and the moderator's answer.
 */
export default function AppealButton({ logId, action, postId, replyId }: AppealButtonProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const appealRef = useMemo(() => (user ? doc(firestore, 'appeals', logId) : null), [firestore, user, logId]);
  const { data: appeal, isLoading } = useDoc<Appeal>(appealRef);

  if (!user || isLoading) return null;

  if (appeal) {
    return (
      <p className="text-xs text-muted-foreground">
        {appeal.status === 'open' && 'You appealed this. A moderator will look at it soon.'}
        {appeal.status === 'reversed' && <>A moderator agreed with your appeal and reversed the decision.{appeal.response && <> “{appeal.response}”</>}</>}
        {appeal.status === 'upheld' && <>A moderator reviewed your appeal and kept the decision.{appeal.response && <> “{appeal.response}”</>}</>}
      </p>
    );
  }

  const send = async () => {
    if (!appealRef) return;
    setIsSending(true);
    try {
      await setDoc(appealRef, {
        userId: user.uid,
        action,
        ...(postId && { postId }),
        ...(postId && replyId && { replyId }),
        text: text.trim(),
        status: 'open',
        createdAt: serverTimestamp(),
      });
      setOpen(false);
      toast({ title: 'Appeal sent', description: 'A moderator will look at it and answer here.' });
    } catch {
      toast({ variant: 'destructive', title: "Couldn't send your appeal", description: 'Please try again, or email w3DevelopsSupport@googlegroups.com.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Appeal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Appeal {replyId ? 'hiding your reply' : WHAT[action]}</DialogTitle>
          <DialogDescription>
            Tell the moderators why you think this was a mistake. A moderator reviews every appeal, and you&apos;ll get the answer in your notifications.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={`appeal-${logId}`}>Your appeal</Label>
          <Textarea id={`appeal-${logId}`} value={text} onChange={e => setText(e.target.value)} maxLength={MAX_APPEAL_LENGTH} rows={5} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSending}>Cancel</Button>
          <Button onClick={send} disabled={isSending || !text.trim()}>{isSending ? 'Sending...' : 'Send appeal'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
