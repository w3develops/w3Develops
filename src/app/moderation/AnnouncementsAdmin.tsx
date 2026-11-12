'use client';

import { useMemo, useState } from 'react';
import { Timestamp, addDoc, collection, deleteDoc, doc, limit, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import ZonedText from '@/components/ZonedText';
import { useNow } from '@/lib/hooks/useClientValues';
import { formatTimestamp } from '@/lib/utils';
import type { GlobalAnnouncement } from '@/lib/types';

const TYPES: { value: GlobalAnnouncement['type']; label: string }[] = [
  { value: 'info', label: 'Info (blue)' },
  { value: 'success', label: 'Good news (green)' },
  { value: 'warning', label: 'Heads up (yellow)' },
  { value: 'alert', label: 'Urgent (red)' },
];

const DAY = 24 * 60 * 60 * 1000;
const DURATIONS = [
  { value: '1', label: '1 day' },
  { value: '3', label: '3 days' },
  { value: '7', label: '1 week' },
  { value: '14', label: '2 weeks' },
  { value: '30', label: '1 month' },
];

const TITLE_MAX = 80;
const MESSAGE_MAX = 300;

/** A link the rules accept: https://... or a page on this site like /events */
function isValidLink(link: string): boolean {
  return /^https:\/\/\S+$/.test(link) || /^\/([^/\s]\S*)?$/.test(link);
}

/**
 * Admins post site-wide announcements here. The newest live one shows in the
 * banner at the top of every page, and recent ones are listed on /news.
 * firestore.rules lets only the `admin` claim write them.
 */
export default function AnnouncementsAdmin() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const now = useNow();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<GlobalAnnouncement['type']>('info');
  const [link, setLink] = useState('');
  const [days, setDays] = useState('7');
  const [busy, setBusy] = useState<string | null>(null);

  const recentQuery = useMemo(() => query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc'), limit(20)), [firestore]);
  const { data: recent } = useCollection<GlobalAnnouncement>(recentQuery);

  const trimmedLink = link.trim();
  const linkError = trimmedLink && !isValidLink(trimmedLink) ? 'Use a full https:// link, or a page here like /events.' : '';
  const canPost = !!user && title.trim() && message.trim() && !linkError && busy === null;

  const post = async () => {
    if (!user || !canPost) return;
    setBusy('new');
    try {
      const start = Timestamp.now();
      await addDoc(collection(firestore, 'announcements'), {
        title: title.trim(),
        message: message.trim(),
        type,
        ...(trimmedLink ? { link: trimmedLink } : {}),
        startTime: start,
        endTime: Timestamp.fromMillis(start.toMillis() + Number(days) * DAY),
        isActive: true,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      toast({ title: 'Announcement posted', description: 'It shows at the top of every page now.' });
      setTitle('');
      setMessage('');
      setLink('');
    } catch {
      toast({ variant: 'destructive', title: "Couldn't post it", description: 'Only admins can post announcements.' });
    } finally {
      setBusy(null);
    }
  };

  const end = async (id: string) => {
    setBusy(id);
    try {
      await updateDoc(doc(firestore, 'announcements', id), { isActive: false });
      toast({ title: 'Announcement ended' });
    } catch {
      toast({ variant: 'destructive', title: "Couldn't end it" });
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this announcement? It will also disappear from /news.')) return;
    setBusy(id);
    try {
      await deleteDoc(doc(firestore, 'announcements', id));
      toast({ title: 'Announcement deleted' });
    } catch {
      toast({ variant: 'destructive', title: "Couldn't delete it" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Post an announcement</CardTitle>
          <CardDescription>
            It shows in a banner at the top of every page until it ends, and on the news page. Members can close the banner.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="announce-title">Title</Label>
            <Input id="announce-title" value={title} maxLength={TITLE_MAX} onChange={e => setTitle(e.target.value)} placeholder="New study groups start Monday" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="announce-message">Message</Label>
            <Textarea id="announce-message" value={message} maxLength={MESSAGE_MAX} rows={3} onChange={e => setMessage(e.target.value)} />
            <p className="text-xs text-muted-foreground text-right">{message.length}/{MESSAGE_MAX}</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="announce-link">Link (optional)</Label>
            <Input id="announce-link" value={link} maxLength={300} onChange={e => setLink(e.target.value)} placeholder="/studygroups or https://..." />
            {linkError && <p className="text-xs text-destructive">{linkError}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Style</Label>
              <Select value={type} onValueChange={value => setType(value as GlobalAnnouncement['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Show it for</Label>
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DURATIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={post} disabled={!canPost}>{busy === 'new' ? 'Posting...' : 'Post announcement'}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Recent announcements</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {recent && recent.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
          {recent?.map(item => {
            const live = item.isActive && item.endTime && now !== null && item.endTime.toMillis() > now;
            return (
              <div key={item.id} className="border rounded-md p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant={live ? 'default' : 'secondary'}>{live ? 'Live' : 'Ended'}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.message}</p>
                {item.link && <p className="text-xs break-all">{item.link}</p>}
                {item.endTime && (
                  <p className="text-xs text-muted-foreground">
                    {live ? 'Ends ' : 'Ended '}<ZonedText render={tz => formatTimestamp(item.endTime, true, tz)} />
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  {live && <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => end(item.id)}>End now</Button>}
                  <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => remove(item.id)}>Delete</Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
