'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { arrayRemove, collection, deleteDoc, doc, DocumentReference, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { ArrowLeft, CalendarDays, Github, Pencil, Trash2, LogOut, Users } from 'lucide-react';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TaskList from '@/components/TaskList';
import CheckInSystem from '@/components/CheckInSystem';
import MemberList from '@/components/MemberList';
import JoinButton from '@/components/JoinButton';
import { formatTimestamp } from '@/lib/utils';
import { Group } from '@/lib/types';
import JoinTimeLeft from '@/components/groups/JoinTimeLeft';
import { GROUP_KINDS, GroupKind, commitmentLabel, isOpenToJoin } from '@/lib/groups';
import { timeZoneLabel } from '@/lib/timezones';
import GroupSchedule from './GroupSchedule';
import ZonedText from '@/components/ZonedText';

export default function GroupDashboard({ kind, groupId, initialGroup }: { kind: GroupKind; groupId: string; initialGroup?: unknown }) {
  const config = GROUP_KINDS[kind];
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState<'leave' | 'delete' | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const groupRef = useMemo(() => doc(firestore, config.collection, groupId) as DocumentReference<Group>, [firestore, config.collection, groupId]);
  const { data: group, isLoading, error } = useDoc<Group>(groupRef, initialGroup);

  if (isLoading) return <div className="text-center py-10 p-4 md:p-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-destructive p-4 md:p-10">Error loading this {config.noun}.</div>;
  if (!group) return <div className="text-center py-10 p-4 md:p-10">This {config.noun} doesn&apos;t exist or was deleted.</div>;

  const isCreator = user?.uid === group.creatorId;
  const isMember = !!user && group.memberIds.includes(user.uid);

  const leave = async () => {
    if (!user) return;
    setIsWorking(true);
    try {
      await updateDoc(groupRef, { memberIds: arrayRemove(user.uid) });
      toast({ title: `You left ${group.name}` });
      setConfirming(null);
    } catch {
      toast({ variant: 'destructive', title: `Could not leave the ${config.noun}`, description: 'Please try again.' });
    } finally {
      setIsWorking(false);
    }
  };

  const remove = async () => {
    setIsWorking(true);
    try {
      // Firestore keeps a deleted document's subcollections, so clear them first
      const batch = writeBatch(firestore);
      for (const sub of ['tasks', 'checkIns']) {
        const snap = await getDocs(collection(firestore, config.collection, groupId, sub));
        snap.forEach(d => batch.delete(d.ref));
      }
      await batch.commit();
      await deleteDoc(groupRef);
      toast({ title: `${group.name} was deleted` });
      router.push(config.path);
    } catch {
      toast({ variant: 'destructive', title: `Could not delete the ${config.noun}`, description: 'Please try again.' });
      setIsWorking(false);
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-10">
      <Link href={config.path} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to All {config.plural}
      </Link>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-4">
              <CardTitle as="h1" className="font-headline text-3xl">{group.name}</CardTitle>
              {isOpenToJoin(group) ? <Badge>New</Badge> : <Badge variant="secondary">In Progress</Badge>}
            </div>
            <CardDescription>{group.description}</CardDescription>
            <JoinTimeLeft group={group} />
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {!isMember && <JoinButton kind={kind} item={group} onJoinSuccess={() => {}} />}
            {isCreator && (
              <>
                <Button asChild variant="outline" size="sm"><Link href={`${config.path}/${groupId}/edit`}><Pencil className="w-4 h-4 mr-2" />Edit</Link></Button>
                <Button variant="outline" size="sm" onClick={() => setConfirming('delete')}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
              </>
            )}
            {isMember && !isCreator && (
              <Button variant="outline" size="sm" onClick={() => setConfirming('leave')}><LogOut className="w-4 h-4 mr-2" />Leave</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Badge variant="secondary" className="text-base">{group.topic}</Badge>
            {commitmentLabel(group) && <Badge variant="outline" className="text-base">{commitmentLabel(group)}</Badge>}
            <GroupSchedule group={group} className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full text-sm font-semibold border border-primary/20" />
            {group.githubUrl && (
              <a href={group.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <Github className="w-5 h-5" /> GitHub Repository
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" />Created on <ZonedText render={tz => formatTimestamp(group.createdAt, false, tz)} /></span>
            {group.timezone && <span>Host&apos;s timezone: {timeZoneLabel(group.timezone)}</span>}
          </div>
        </CardContent>
      </Card>

      <TaskList parentId={groupId} collectionPath={config.collection} memberIds={group.memberIds} />
      <CheckInSystem parentId={groupId} collectionPath={config.collection} memberIds={group.memberIds} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Members ({group.memberIds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberList memberIds={group.memberIds} />
        </CardContent>
      </Card>

      <Dialog open={!!confirming} onOpenChange={open => !open && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirming === 'delete' ? `Delete ${group.name}?` : `Leave ${group.name}?`}</DialogTitle>
            <DialogDescription>
              {confirming === 'delete'
                ? `This removes the ${config.noun}, its tasks and its check-ins for everyone. It can't be undone.`
                : isOpenToJoin(group)
                  ? `You can rejoin while it's still taking new members.`
                  : `This ${config.noun} has stopped taking new members, so you won't be able to rejoin.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)} disabled={isWorking}>Cancel</Button>
            <Button variant="destructive" onClick={confirming === 'delete' ? remove : leave} disabled={isWorking}>
              {isWorking ? 'Working...' : confirming === 'delete' ? 'Delete' : 'Leave'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
