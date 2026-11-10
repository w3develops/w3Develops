'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useIsModerator } from '@/lib/hooks/useIsModerator';
import type { ModeratedKind } from '@/lib/moderated-items';
import { useItemModeration } from '@/app/moderation/useItemModeration';

const PART_NOUNS: Record<string, string> = { checkIns: 'check-in', updates: 'update', entries: 'entry', tasks: 'task' };

/**
 * A delete button only moderators see, for one check-in, meetup update or
 * competition entry. It's saved with a moderation log entry.
 */
export default function ModeratorDeletePart({ kind, id, part, partId, ownerId }: { kind: ModeratedKind; id: string; part: string; partId: string; ownerId: string }) {
  const isModerator = useIsModerator();
  const { deletePart } = useItemModeration();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const noun = PART_NOUNS[part] ?? 'item';

  if (!isModerator) return null;

  const remove = async () => {
    setIsWorking(true);
    try {
      await deletePart(kind, id, part, partId, ownerId, note);
      toast({ title: `The ${noun} was deleted`, description: "It's in the moderation log." });
      setOpen(false);
    } catch {
      toast({ variant: 'destructive', title: "Couldn't delete it", description: 'Please reload and try again.' });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => { setNote(''); setOpen(true); }} aria-label={`Delete this ${noun} as a moderator`}>
        <Trash2 className="h-3 w-3" aria-hidden="true" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this {noun}?</DialogTitle>
            <DialogDescription>It&apos;s removed for everyone and can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1">
            <Label htmlFor="moderator-part-note">Why (for the moderation log)</Label>
            <Textarea id="moderator-part-note" value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={2} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isWorking}>Cancel</Button>
            <Button variant="destructive" onClick={remove} disabled={isWorking || !note.trim()}>{isWorking ? 'Deleting...' : 'Delete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
