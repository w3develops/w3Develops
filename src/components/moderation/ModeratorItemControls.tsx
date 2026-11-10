'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useIsModerator } from '@/lib/hooks/useIsModerator';
import { MODERATED_ITEMS, type ModeratedField, type ModeratedKind } from '@/lib/moderated-items';
import { useItemModeration } from '@/app/moderation/useItemModeration';

interface ModeratorItemControlsProps {
  kind: ModeratedKind;
  id: string;
  /** The item as loaded, for its owner and current wording */
  item: Record<string, unknown>;
  /** Shown on cards in a list, where there's no page to leave after deleting */
  compact?: boolean;
}

function NoteField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-1">
      <Label htmlFor="moderator-note">Why (for the moderation log)</Label>
      <Textarea id="moderator-note" value={value} onChange={e => onChange(e.target.value)} maxLength={500} rows={2}
        placeholder="Which rule it broke, or what you fixed" />
    </div>
  );
}

/**
 * Edit and Delete buttons that only moderators see, on any member's study
 * group, meetup, competition, job post or solo project. Each action is saved
 * with a moderation log entry (src/app/moderation/useItemModeration.ts).
 */
export default function ModeratorItemControls({ kind, id, item, compact = false }: ModeratorItemControlsProps) {
  const isModerator = useIsModerator();
  const router = useRouter();
  const { toast } = useToast();
  const { editItem, deleteItem } = useItemModeration();
  const config = MODERATED_ITEMS[kind];
  const fields = config.fields as Record<string, ModeratedField>;
  const [mode, setMode] = useState<'edit' | 'delete' | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  if (!isModerator) return null;
  const ownerId = typeof item[config.ownerField] === 'string' ? (item[config.ownerField] as string) : '';

  const open = (next: 'edit' | 'delete') => {
    setValues(Object.fromEntries(Object.keys(fields).map(key => [key, typeof item[key] === 'string' ? (item[key] as string) : ''])));
    setNote('');
    setMode(next);
  };

  const changed = Object.fromEntries(Object.entries(values).filter(([key, value]) => value !== (item[key] ?? '')));
  const tooLong = Object.entries(values).find(([key, value]) => value.length > fields[key].max);

  const run = async () => {
    setIsWorking(true);
    try {
      if (mode === 'edit') {
        await editItem(kind, id, ownerId, changed, note);
        toast({ title: 'Saved', description: "It's in the moderation log." });
        setMode(null);
      } else {
        await deleteItem(kind, id, ownerId, note);
        toast({ title: `The ${config.noun} was deleted`, description: "It's in the moderation log." });
        setMode(null);
        if (!compact) router.push(config.listPath);
      }
    } catch {
      toast({ variant: 'destructive', title: "Couldn't do that", description: 'It may have changed meanwhile. Please reload and try again.' });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <>
      <div className={compact ? 'flex gap-1' : 'flex flex-wrap items-center gap-2 rounded-md border border-dashed px-3 py-2'}>
        {!compact && <span className="flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="h-3 w-3" aria-hidden="true" /> Moderator</span>}
        <Button variant="outline" size="sm" onClick={() => open('edit')} aria-label={`Edit this ${config.noun} as a moderator`}>
          <Pencil className="mr-1 h-3 w-3" aria-hidden="true" /> Edit
        </Button>
        <Button variant="outline" size="sm" className="text-destructive" onClick={() => open('delete')} aria-label={`Delete this ${config.noun} as a moderator`}>
          <Trash2 className="mr-1 h-3 w-3" aria-hidden="true" /> Delete
        </Button>
      </div>

      <Dialog open={mode !== null} onOpenChange={isOpen => { if (!isOpen) setMode(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mode === 'edit' ? `Edit this ${config.noun}` : `Delete this ${config.noun}?`}</DialogTitle>
            <DialogDescription>
              {mode === 'edit'
                ? 'You can change its wording, not who runs it or who has joined.'
                : `This removes it for everyone${config.parts.length ? ', with its ' + config.parts.join(', ').replace('checkIns', 'check-ins') : ''}. It can't be undone.`}
            </DialogDescription>
          </DialogHeader>
          {mode === 'edit' && (
            <div className="grid gap-3">
              {Object.entries(fields).map(([key, field]) => (
                <div key={key} className="grid gap-1">
                  <Label htmlFor={`moderate-${key}`}>{field.label}</Label>
                  {field.long ? (
                    <Textarea id={`moderate-${key}`} value={values[key] ?? ''} rows={4} onChange={e => setValues({ ...values, [key]: e.target.value })} />
                  ) : (
                    <Input id={`moderate-${key}`} value={values[key] ?? ''} onChange={e => setValues({ ...values, [key]: e.target.value })} />
                  )}
                  {(values[key]?.length ?? 0) > field.max && <p className="text-xs text-destructive">Up to {field.max} characters.</p>}
                </div>
              ))}
            </div>
          )}
          <NoteField value={note} onChange={setNote} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setMode(null)} disabled={isWorking}>Cancel</Button>
            <Button
              variant={mode === 'delete' ? 'destructive' : 'default'}
              onClick={run}
              disabled={isWorking || !note.trim() || (mode === 'edit' && (Object.keys(changed).length === 0 || !!tooLong))}
            >
              {isWorking ? 'Working...' : mode === 'edit' ? 'Save' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
