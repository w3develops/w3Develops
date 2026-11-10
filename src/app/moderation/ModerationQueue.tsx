'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, doc, limit, orderBy, query, where } from 'firebase/firestore';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { REPORT_REASONS } from '@/components/ReportUserButton';
import PostCard from '@/components/posts/PostCard';
import ZonedText from '@/components/ZonedText';
import { useStaffRoles } from '@/lib/hooks/useIsModerator';
import { useNow } from '@/lib/hooks/useClientValues';
import { useDocsByIds } from '@/lib/hooks/useDocsByIds';
import { MODERATION_ACTIONS, POST_REPORT_REASONS, SUSPENSION_DAYS } from '@/lib/member-posts';
import { formatTimestamp } from '@/lib/utils';
import type { MemberPost, MemberStanding, ModerationLogEntry, Report, UserProfile } from '@/lib/types';
import ModerationTeam from './ModerationTeam';
import { useModerationActions, type ActionRequest, type ModeratorAction } from './useModerationActions';
import { MODERATED_ITEMS, type ModeratedKind } from '@/lib/moderated-items';

const REASON_LABELS: Record<string, string> = { ...REPORT_REASONS, ...POST_REPORT_REASONS };

const ACTION_BUTTONS: Record<ModeratorAction, string> = {
  hide: 'Hide post',
  restore: 'Restore post',
  delete: 'Delete post',
  dismiss: 'Dismiss reports',
  warn: 'Warn author',
  suspend: 'Suspend author',
  unsuspend: 'Lift suspension',
};

type Pending = Omit<ActionRequest, 'note'> & { title: string };

/** Asks for a note (and a length, for a suspension) before carrying out an action */
function ActionDialog({ pending, onClose }: { pending: Pending | null; onClose: () => void }) {
  const act = useModerationActions();
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [days, setDays] = useState<string>(String(SUSPENSION_DAYS[0]));
  const [isWorking, setIsWorking] = useState(false);
  const needsNote = pending?.action === 'warn' || pending?.action === 'suspend';

  const confirm = async () => {
    if (!pending) return;
    setIsWorking(true);
    try {
      await act({ ...pending, note, days: Number(days) });
      toast({ title: 'Done', description: `${MODERATION_ACTIONS[pending.action]}. It's in the log.` });
      setNote('');
      onClose();
    } catch {
      toast({ variant: 'destructive', title: "Couldn't do that", description: 'It may have changed meanwhile. Please reload and try again.' });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Dialog open={!!pending} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pending?.title}</DialogTitle>
          <DialogDescription>
            {pending?.action === 'warn' && 'The member sees this note on the feed.'}
            {pending?.action === 'delete' && 'The post is removed for good. The reports and this log entry stay.'}
            {pending?.action !== 'warn' && pending?.action !== 'delete' && 'This is saved in the moderation log.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {pending?.action === 'suspend' && (
            <div className="grid gap-1">
              <Label htmlFor="suspend-days">Pause their posting for</Label>
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger id="suspend-days"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUSPENSION_DAYS.map(n => <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'day' : 'days'}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-1">
            <Label htmlFor="moderation-note">{needsNote ? 'Note to the member' : 'Note (optional)'}</Label>
            <Textarea id="moderation-note" value={note} onChange={e => setNote(e.target.value)} maxLength={500}
              placeholder={needsNote ? 'Which rule it broke, kindly and briefly.' : 'Why, for the record.'} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isWorking}>Cancel</Button>
          <Button variant={pending?.action === 'restore' || pending?.action === 'dismiss' ? 'default' : 'destructive'}
            onClick={confirm} disabled={isWorking || (needsNote && !note.trim())}>
            {isWorking ? 'Working...' : pending?.title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A member's warnings and suspension, for a moderator deciding what to do */
function StandingSummary({ userId }: { userId: string }) {
  const firestore = useFirestore();
  const ref = useMemo(() => doc(firestore, 'memberStandings', userId), [firestore, userId]);
  const { data: standing } = useDoc<MemberStanding>(ref);
  const now = useNow();
  if (!standing) return <span className="text-xs text-muted-foreground">No warnings</span>;
  const suspended = standing.suspendedUntil && now !== null && standing.suspendedUntil.toMillis() > now;
  return (
    <span className="text-xs text-muted-foreground">
      {standing.warnings} {standing.warnings === 1 ? 'warning' : 'warnings'}
      {suspended && <> · suspended until <ZonedText render={tz => formatTimestamp(standing.suspendedUntil!, true, tz)} /></>}
    </span>
  );
}

function ActionButtons({ actions, onPick }: { actions: ModeratorAction[]; onPick: (action: ModeratorAction) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(action => (
        <Button key={action} size="sm" variant={action === 'delete' || action === 'suspend' ? 'destructive' : 'outline'} onClick={() => onPick(action)}>
          {ACTION_BUTTONS[action]}
        </Button>
      ))}
    </div>
  );
}

function ReportList({ reports }: { reports: Report[] }) {
  return (
    <ul className="space-y-1 text-sm">
      {reports.map(report => (
        <li key={report.id}>
          <Badge variant="outline" className="mr-2">{REASON_LABELS[report.reason] ?? report.reason}</Badge>
          {report.details && <span className="text-muted-foreground">“{report.details}”</span>}
          <span className="ml-2 text-xs text-muted-foreground"><ZonedText render={tz => formatTimestamp(report.createdAt, true, tz)} /></span>
        </li>
      ))}
    </ul>
  );
}

/** One post with its open reports and what a moderator can do about it */
function ReviewPost({ postId, reports, onAction }: { postId: string; reports: Report[]; onAction: (pending: Pending) => void }) {
  const firestore = useFirestore();
  const ref = useMemo(() => doc(firestore, 'memberPosts', postId), [firestore, postId]);
  const { data: post, isLoading } = useDoc<MemberPost>(ref);
  const authorId = post?.authorId ?? reports[0]?.reportedUserId;
  const pick = (action: ModeratorAction) => onAction({
    action,
    postId,
    targetUserId: authorId,
    reportIds: reports.map(report => report.id),
    title: ACTION_BUTTONS[action],
  });

  const memberActions: ModeratorAction[] = ['warn', 'suspend', 'unsuspend'];
  const details = (
    <div className="space-y-3 border-t pt-3">
      {reports.length > 0 && <p className="text-sm font-medium">{reports.length} open {reports.length === 1 ? 'report' : 'reports'}</p>}
      <ReportList reports={reports} />
      <div className="flex items-center gap-2"><span className="text-xs">Author:</span><StandingSummary userId={authorId} /></div>
    </div>
  );

  if (isLoading) return <Card><CardContent className="p-4 text-sm text-muted-foreground">Loading post...</CardContent></Card>;
  if (!post) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">This post was deleted.</p>
          {details}
          <ActionButtons actions={['dismiss', ...memberActions]} onPick={pick} />
        </CardContent>
      </Card>
    );
  }
  return (
    <PostCard post={post}>
      {details}
      <ActionButtons actions={[post.status === 'visible' ? 'hide' : 'restore', 'delete', ...(reports.length ? ['dismiss' as const] : []), ...memberActions]} onPick={pick} />
    </PostCard>
  );
}

/** Names the item an edit or deletion was about, with a link while it still exists */
function ContentPathLabel({ path, deleted }: { path: string; deleted: boolean }) {
  const [kind, id, part] = path.split('/');
  const config = MODERATED_ITEMS[kind as ModeratedKind];
  if (!config) return <span className="text-xs text-muted-foreground"> ({path})</span>;
  const partNoun = part === 'checkIns' ? 'check-in' : part === 'entries' ? 'entry' : part?.replace(/s$/, '');
  const withArticle = (noun: string) => `${/^[aeiou]/.test(noun) ? 'an' : 'a'} ${noun}`;
  const what = partNoun ? `${withArticle(partNoun)} in ${withArticle(config.noun)}` : withArticle(config.noun);
  return (
    <span className="text-xs text-muted-foreground">
      {' '}({deleted && !part ? what : <Link href={kind === 'soloProjects' ? config.listPath : `${config.listPath}/${id}`} className="underline">{what}</Link>})
    </span>
  );
}

function LogEntries({ entries }: { entries: ModerationLogEntry[] }) {
  const memberIds = [...new Set(entries.flatMap(entry => [entry.actorId, entry.targetUserId]).filter(id => id !== 'system'))];
  const { data: members } = useDocsByIds<UserProfile>('users', memberIds);
  const names = new Map((members ?? []).map(member => [member.id, member.username]));
  const name = (id: string) => (id === 'system' ? 'Auto-hide' : names.get(id) ?? id.slice(0, 8));
  if (entries.length === 0) return <p className="text-muted-foreground">Nothing yet.</p>;
  return (
    <ul className="divide-y">
      {entries.map(entry => (
        <li key={entry.id} className="py-2 text-sm">
          <span className="text-xs text-muted-foreground mr-2"><ZonedText render={tz => formatTimestamp(entry.createdAt, true, tz)} /></span>
          <strong>{name(entry.actorId)}</strong>: {MODERATION_ACTIONS[entry.action] ?? entry.action}
          {' · '}<Link href={`/users/${entry.targetUserId}`} className="underline">{name(entry.targetUserId)}</Link>
          {entry.postId && <span className="text-xs text-muted-foreground"> (post {entry.postId.slice(0, 8)})</span>}
          {entry.contentPath && <ContentPathLabel path={entry.contentPath} deleted={entry.action === 'delete-content'} />}
          {entry.note && <p className="text-muted-foreground">“{entry.note}”</p>}
        </li>
      ))}
    </ul>
  );
}

function Queue({ isAdmin }: { isAdmin: boolean }) {
  const firestore = useFirestore();
  const [pending, setPending] = useState<Pending | null>(null);

  const reportsQuery = useMemo(() => query(collection(firestore, 'reports'), where('status', '==', 'open'), orderBy('createdAt', 'desc'), limit(200)), [firestore]);
  const { data: reports } = useCollection<Report>(reportsQuery);
  const hiddenQuery = useMemo(() => query(collection(firestore, 'memberPosts'), where('status', '==', 'hidden'), orderBy('createdAt', 'desc'), limit(50)), [firestore]);
  const { data: hidden } = useCollection<MemberPost>(hiddenQuery);
  const logQuery = useMemo(() => query(collection(firestore, 'moderationLog'), orderBy('createdAt', 'desc'), limit(100)), [firestore]);
  const { data: log } = useCollection<ModerationLogEntry>(logQuery);

  // Post reports grouped by post, most-reported first; profile reports apart
  const { byPost, memberReports } = useMemo(() => {
    const groups = new Map<string, Report[]>();
    const others: Report[] = [];
    for (const report of reports ?? []) {
      if (report.postId) groups.set(report.postId, [...(groups.get(report.postId) ?? []), report]);
      else others.push(report);
    }
    return { byPost: [...groups.entries()].sort((a, b) => b[1].length - a[1].length), memberReports: others };
  }, [reports]);
  const reportedIds = new Set(byPost.map(([postId]) => postId));
  const otherHidden = (hidden ?? []).filter(post => !reportedIds.has(post.id));

  return (
    <>
      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Reported posts ({byPost.length})</TabsTrigger>
          <TabsTrigger value="members">Member reports ({memberReports.length})</TabsTrigger>
          <TabsTrigger value="hidden">Hidden ({otherHidden.length})</TabsTrigger>
          <TabsTrigger value="log">Log</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {reports && byPost.length === 0 && <p className="text-muted-foreground">No reported posts. Nice.</p>}
          {byPost.map(([postId, postReports]) => <ReviewPost key={postId} postId={postId} reports={postReports} onAction={setPending} />)}
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          {reports && memberReports.length === 0 && <p className="text-muted-foreground">No open member reports.</p>}
          {memberReports.map(report => (
            <Card key={report.id}>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm">
                  Report about <Link href={`/users/${report.reportedUserId}`} className="underline">this member</Link>
                  {' '}from <Link href={report.page} className="underline">{report.page}</Link>
                </p>
                <ReportList reports={[report]} />
                <StandingSummary userId={report.reportedUserId} />
                <ActionButtons actions={['dismiss', 'warn', 'suspend', 'unsuspend']} onPick={action => setPending({
                  action, targetUserId: report.reportedUserId, reportIds: action === 'dismiss' ? [report.id] : [], title: action === 'dismiss' ? 'Close report' : ACTION_BUTTONS[action],
                })} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="hidden" className="space-y-4">
          {hidden && otherHidden.length === 0 && <p className="text-muted-foreground">No other hidden posts.</p>}
          {otherHidden.map(post => <ReviewPost key={post.id} postId={post.id} reports={[]} onAction={setPending} />)}
        </TabsContent>

        <TabsContent value="team">
          <ModerationTeam isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="log">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Latest moderation actions</CardTitle></CardHeader>
            <CardContent><LogEntries entries={log ?? []} /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <ActionDialog pending={pending} onClose={() => setPending(null)} />
    </>
  );
}

/** The moderators' review page. Only members with the moderator claim can read any of it. */
export default function ModerationQueue() {
  const { user, isUserLoading } = useUser();
  const roles = useStaffRoles();

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-6">
      <div>
        <h1 className="text-3xl font-headline">Moderation</h1>
        <p className="text-muted-foreground">
          Review reported posts, then hide, restore or delete them, or warn or suspend the author. Every action is logged.
          Follow the <Link href="/code-of-conduct" className="underline">Code of Conduct</Link>.
        </p>
      </div>
      {isUserLoading || (user && roles === null) ? (
        <p className="text-muted-foreground">Checking your access...</p>
      ) : roles?.moderator ? (
        <Queue isAdmin={roles.admin} />
      ) : (
        <p className="text-muted-foreground">This page is for w3Develops moderators.</p>
      )}
    </div>
  );
}
