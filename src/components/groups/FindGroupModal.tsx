'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, Query, Timestamp } from 'firebase/firestore';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { topics } from '@/lib/constants';
import { useOneWeekAgo } from '@/lib/hooks/useClientValues';
import { Group } from '@/lib/types';
import { GROUP_KINDS, GroupKind, MAX_MEMBERS, commitmentLabel, isFull } from '@/lib/groups';
import JoinButton from '@/components/JoinButton';
import GroupSchedule from './GroupSchedule';

const ANY_TOPIC = 'Any topic';

// Lists every group still taking members, filtered by topic in the browser.
// Filtering here instead of in the query means no extra Firestore indexes.
export default function FindGroupModal({ kind, isOpen, onClose }: { kind: GroupKind; isOpen: boolean; onClose: () => void }) {
  const config = GROUP_KINDS[kind];
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [topic, setTopic] = useState(ANY_TOPIC);

  const oneWeekAgo = useOneWeekAgo();
  const openGroupsQuery = useMemo(() => {
    if (!isOpen || oneWeekAgo === null) return null;
    return query(collection(firestore, config.collection), where('createdAt', '>', Timestamp.fromMillis(oneWeekAgo)), orderBy('createdAt', 'desc')) as Query<Group>;
  }, [isOpen, oneWeekAgo, firestore, config.collection]);

  // Book clubs that stay open to join after their first week
  const anytimeQuery = useMemo(() => {
    if (!isOpen || !config.canStayOpen) return null;
    return query(collection(firestore, config.collection), where('openToJoinAnytime', '==', true)) as Query<Group>;
  }, [isOpen, firestore, config.collection, config.canStayOpen]);

  const { data: newGroups, isLoading: isQueryLoading } = useCollection<Group>(openGroupsQuery);
  const { data: anytimeGroups, isLoading: isAnytimeLoading } = useCollection<Group>(anytimeQuery);
  const isLoading = isQueryLoading || isAnytimeLoading || oneWeekAgo === null;
  const openGroups = useMemo(() => {
    const newIds = new Set((newGroups || []).map(g => g.id));
    return [...(newGroups || []), ...(anytimeGroups || []).filter(g => !newIds.has(g.id))];
  }, [newGroups, anytimeGroups]);

  const matches = useMemo(() => openGroups.filter(g =>
    !isFull(g) && (!user || !g.memberIds.includes(user.uid)) && (topic === ANY_TOPIC || g.topic === topic)
  ), [openGroups, user, topic]);

  const handleJoined = (id: string) => {
    onClose();
    router.push(`${config.path}/${id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Join a {config.title}</DialogTitle>
          <DialogDescription>
            {config.plural} take new members during their first week{config.canStayOpen ? ', and some stay open to join anytime' : ''}. Pick a topic to see which ones are open.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="find-topic">{config.topicLabel}</Label>
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger id="find-topic"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              {[ANY_TOPIC, ...topics.filter(t => t !== 'Other')].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {isLoading && <p className="text-sm text-muted-foreground">Looking for open {config.plural.toLowerCase()}...</p>}
          {!isLoading && matches.map(group => (
            <div key={group.id} className="flex items-center justify-between gap-3 p-3 border rounded-md">
              <div className="min-w-0 space-y-1">
                <p className="font-semibold truncate">{group.name}</p>
                <p className="text-xs text-muted-foreground">
                  {group.topic}{commitmentLabel(group) ? ` · ${commitmentLabel(group)}` : ''} · {group.memberIds.length} / {MAX_MEMBERS} members
                </p>
                <GroupSchedule group={group} className="flex items-center gap-1 text-xs text-muted-foreground" />
              </div>
              <JoinButton kind={kind} item={group} onJoinSuccess={handleJoined} />
            </div>
          ))}
          {!isLoading && matches.length === 0 && (
            <div className="text-center py-4 space-y-3">
              <p className="text-muted-foreground">No open {config.plural.toLowerCase()} match right now.</p>
              <Button asChild onClick={onClose}>
                <Link href={`${config.path}/create`}>Start a New {config.title}</Link>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
