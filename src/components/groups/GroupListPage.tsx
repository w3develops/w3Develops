'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, Query, orderBy, where, limit, query, Timestamp } from 'firebase/firestore';
import { Users, Search, CalendarDays, PlusCircle, Github } from 'lucide-react';
import { useCollection, useUser, useFirestore } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatTimestamp } from '@/lib/utils';
import { useJoinWindowStart } from '@/lib/hooks/useClientValues';
import JoinTimeLeft from '@/components/groups/JoinTimeLeft';
import { Group } from '@/lib/types';
import { GROUP_KINDS, GroupKind, MAX_MEMBERS, commitmentLabel, isNew, isOpenToJoin } from '@/lib/groups';
import JoinButton from '@/components/JoinButton';
import FindGroupModal from './FindGroupModal';
import GroupSchedule from './GroupSchedule';
import ZonedText from '@/components/ZonedText';

function GroupCardSkeleton() {
  return (
    <Card className="flex flex-col animate-pulse">
      <CardHeader>
        <div className="h-6 w-40 bg-muted rounded"></div>
        <div className="h-5 w-24 bg-muted rounded-full mt-1"></div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
        <div className="h-9 w-28 bg-muted rounded-md mt-4"></div>
      </CardContent>
    </Card>
  );
}

function GroupCard({ kind, group }: { kind: GroupKind; group: Group }) {
  const config = GROUP_KINDS[kind];
  const open = isOpenToJoin(group);
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <Link href={`${config.path}/${group.id}`} className="hover:underline">
            <CardTitle>{group.name}</CardTitle>
          </Link>
          {isNew(group) ? <Badge>New</Badge> : <Badge variant="secondary">In Progress</Badge>}
        </div>
        <Badge variant="secondary" className="w-fit">{group.topic}</Badge>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-4 h-10 overflow-hidden">{group.description}</p>
          <div className="flex flex-col text-sm text-muted-foreground gap-2">
            <JoinTimeLeft group={group} />
            <div className="flex items-center"><Users className="w-4 h-4 mr-2" /> {group.memberIds.length} / {MAX_MEMBERS} Members</div>
            <GroupSchedule group={group} />
            {commitmentLabel(group) && <Badge variant="outline" className="w-fit">{commitmentLabel(group)}</Badge>}
            <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> Created: <ZonedText render={tz => formatTimestamp(group.createdAt, false, tz)} /></div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {group.githubUrl && (
            <Button variant="outline" asChild size="sm">
              <a href={group.githubUrl} target="_blank" rel="noopener noreferrer"><Github className="w-4 h-4 mr-2" />GitHub</a>
            </Button>
          )}
          {open && <JoinButton kind={kind} item={group} />}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * A list of study groups, group projects or book clubs. `initial` is the
 * server's copy (see src/lib/list-pages.ts), shown until the live lists load.
 */
export default function GroupListPage({ kind, initial }: { kind: GroupKind; initial?: { newGroups: unknown[]; inProgress: unknown[] } | null }) {
  const config = GROUP_KINDS[kind];
  const firestore = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Recent groups and older ones; unknown until the page runs in the browser
  const windowStart = useJoinWindowStart();
  const newQuery = useMemo(() => windowStart === null ? null : query(
    collection(firestore, config.collection), where('createdAt', '>', Timestamp.fromMillis(windowStart)), orderBy('createdAt', 'desc'), limit(25)
  ) as Query<Group>, [firestore, config.collection, windowStart]);
  const inProgressQuery = useMemo(() => windowStart === null ? null : query(
    collection(firestore, config.collection), where('createdAt', '<=', Timestamp.fromMillis(windowStart)), orderBy('createdAt', 'desc'), limit(50)
  ) as Query<Group>, [firestore, config.collection, windowStart]);

  const { data: newGroups, isLoading: isLoadingNew } = useCollection<Group>(newQuery, initial?.newGroups);
  const { data: inProgressGroups, isLoading: isLoadingInProgress } = useCollection<Group>(inProgressQuery, initial?.inProgress);
  const isLoading = (windowStart === null && !initial) || isLoadingNew || isLoadingInProgress;

  const term = searchTerm.toLowerCase();
  const matches = (g: Group) => !term || g.name_lowercase.includes(term) || g.topic.toLowerCase().includes(term);
  // "New" means not started yet: a group with a later start date stays new
  // past the usual two weeks, and one with an early start date moves on sooner
  const all = [...(newGroups ?? []), ...(inProgressGroups ?? [])];
  const loaded = !!newGroups || !!inProgressGroups;
  const sections = [
    { title: 'New', groups: loaded ? all.filter(g => isNew(g)).filter(matches) : undefined, empty: `No new ${config.plural.toLowerCase()} at this time.` },
    { title: 'In Progress', groups: loaded ? all.filter(g => !isNew(g)).filter(matches) : undefined, empty: `No in-progress ${config.plural.toLowerCase()} at this time.` },
  ];

  return (
    <div className="p-4 md:p-10">
      <FindGroupModal kind={kind} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-headline">{config.plural}</h1>
            <p className="text-muted-foreground">{config.tagline} Meeting times are shown in your timezone.</p>
          </div>
          {user && (
            <div className="flex gap-2 flex-shrink-0">
              <Button onClick={() => setIsModalOpen(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Join a {config.label}
              </Button>
              <Button asChild variant="secondary">
                <Link href={`${config.path}/create`}>Create a {config.label}</Link>
              </Button>
            </div>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={`Search by ${config.noun} name or topic...`}
            className="pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {sections.map(section => (
          <section key={section.title} className="space-y-4">
            <h2 className="text-2xl font-semibold w-fit border-b-4 border-foreground">{section.title}</h2>
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <GroupCardSkeleton /><GroupCardSkeleton /><GroupCardSkeleton />
              </div>
            ) : section.groups?.length ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {section.groups.map(group => <GroupCard key={group.id} kind={kind} group={group} />)}
              </div>
            ) : (
              <p className="text-muted-foreground">{term ? 'Nothing matches that search.' : section.empty}</p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
