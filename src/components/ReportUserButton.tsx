'use client';

import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Flag } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

// The reasons the Firestore rules accept (see match /reports)
export const REPORT_REASONS = {
  harassment: 'Harassment or bullying',
  spam: 'Spam or scams',
  impersonation: 'Pretending to be someone else',
  inappropriate: 'Inappropriate profile or content',
  inactive: "Inactive in a group they joined",
  other: 'Something else',
} as const;
type ReportReason = keyof typeof REPORT_REASONS;

const MAX_DETAILS = 1000;

/**
 * Lets a signed-in member privately report another member to the
 * w3Develops team. Reports are saved where only the team can read them.
 */
export default function ReportUserButton({ reportedUserId, username }: { reportedUserId: string; username?: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!user || user.uid === reportedUserId) return null;

  const send = async () => {
    if (!reason) return;
    setIsSending(true);
    try {
      await addDoc(collection(firestore, 'reports'), {
        reporterId: user.uid,
        reportedUserId,
        reason,
        details: details.trim(),
        page: window.location.pathname,
        status: 'open',
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Report sent', description: 'Thank you. The w3Develops team will look into it.' });
      setOpen(false);
      setReason('');
      setDetails('');
    } catch {
      toast({ variant: 'destructive', title: "Couldn't send the report", description: 'Please try again, or email team@w3develops.org.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag className="w-4 h-4 mr-2" aria-hidden="true" /> Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {username || 'this member'}</DialogTitle>
          <DialogDescription>
            Reports are private: {username || 'the member'} won&apos;t see who sent it. See our{' '}
            <Link href="/code-of-conduct" target="_blank" className="underline">Code of Conduct</Link>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <RadioGroup value={reason} onValueChange={value => setReason(value as ReportReason)} aria-label="Reason">
            {(Object.entries(REPORT_REASONS) as [ReportReason, string][]).map(([value, label]) => (
              <div key={value} className="flex items-center gap-2">
                <RadioGroupItem value={value} id={`reason-${value}`} />
                <Label htmlFor={`reason-${value}`} className="font-normal">{label}</Label>
              </div>
            ))}
          </RadioGroup>
          <div className="grid gap-2">
            <Label htmlFor="report-details">What happened? (optional)</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={e => setDetails(e.target.value)}
              maxLength={MAX_DETAILS}
              placeholder="Links to where it happened help us act quickly."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSending}>Cancel</Button>
          <Button variant="destructive" onClick={send} disabled={!reason || isSending}>
            {isSending ? 'Sending...' : 'Send report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
