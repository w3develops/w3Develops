
'use client';

import { useMemo, useState } from 'react';
import { useCollection, useUser, useFirestore } from '@/firebase';
import { collection, Query, orderBy, where, limit, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { StudyGroup } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Users, Search, CalendarDays, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatTimestamp } from '@/lib/utils';
import { ONE_WEEK_IN_MS } from '@/lib/constants';
import { JoinGroupModal } from '@/components/modals/JoinGroupModal';
import JoinGroupButton from '@/components/JoinGroupButton';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';

function GroupCardSkeleton() {
  return (
    <Card className="flex flex-col animate-pulse">
      <CardHeader>
        <div className='flex justify-between items-start'>
          <div className="h-6 w-40 bg-muted rounded"></div>
          <div className="h-6 w-16 bg-muted rounded-full"></div>
        </div>
        <div className="h-5 w-24 bg-muted rounded-full mt-1"></div>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
          <div>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-5/6 mb-4"></div>
            <div className="space-y-2">
              <div className="h-5 w-36 bg-muted rounded"></div>
              <div className="h-6 w-28 bg-muted rounded-full"></div>
              <div className="h-5 w-44 bg-muted rounded"></div>
            </div>
          </div>
        <div className="h-9 w-28 bg-muted rounded-md mt-4"></div>
      </CardContent>
    </Card>
  );
}

function GroupsPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <GroupCardSkeleton />
        <GroupCardSkeleton />
        <GroupCardSkeleton />
      </div>
    </div>
  )
}

export default function GroupsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const oneWeekAgo = useMemo(() => new Date(Date.now() - ONE_WEEK_IN_MS), []);

  const newGroupsQuery = useMemo(() => {
    return query(
        collection(firestore, 'studyGroups'), 
        orderBy('createdAt', 'desc'),
        where('createdAt', '>', oneWeekAgo),
        limit(25)
    ) as Query;
  }, [firestore, oneWeekAgo]);

  const inProgressGroupsQuery = useMemo(() => {
    return query(
        collection(firestore, 'studyGroups'),
        orderBy('createdAt', 'desc'),
        where('createdAt', '<=', oneWeekAgo),
        limit(50)
    ) as Query;
  }, [firestore, oneWeekAgo]);

  const { data: newGroups, isLoading: isLoadingNew } = useCollection<StudyGroup>(newGroupsQuery);
  const { data: inProgressGroups, isLoading: isLoadingInProgress } = useCollection<StudyGroup>(inProgressGroupsQuery);

  const filteredGroups = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return { newGroups, inProgressGroups };
    
    return {
        newGroups: newGroups?.filter(g => g.name_lowercase.includes(term) || g.topic.toLowerCase().includes(term)),
        inProgressGroups: inProgressGroups?.filter(g => g.name_lowercase.includes(term) || g.topic.toLowerCase().includes(term))
    }
  }, [searchTerm, newGroups, inProgressGroups]);

  const isLoading = isLoadingNew || isLoadingInProgress;

  return (
    <div className="p-4 md:p-10">
      <JoinGroupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-headline">Explore Study Groups</h1>
            <p className="text-muted-foreground">Find a group to learn and grow with.</p>
          </div>
          {user && (
            <div className="flex gap-2 flex-shrink-0">
               <Button onClick={() => setIsModalOpen(true)}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Join a Group
              </Button>
              <Button asChild variant="secondary">
                  <Link href="/studygroups/create">Create a Group</Link>
              </Button>
            </div>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by group name or topic..."
            className="pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading && <GroupsPageSkeleton />}
        
        {!isLoading && !filteredGroups.newGroups?.length && !filteredGroups.inProgressGroups?.length && searchTerm && (
          <div className="text-center py-12">
              <h3 className="text-xl font-semibold">No Groups Found</h3>
              <p className="text-muted-foreground mt-2">Try a different search term.</p>
          </div>
        )}

        {/* New Groups Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold w-fit border-b-4 border-foreground">New</h2>
          {!isLoading && filteredGroups.newGroups && filteredGroups.newGroups.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.newGroups.map(group => {
                const isNew = group.createdAt && (Date.now() - group.createdAt.toMillis()) < ONE_WEEK_IN_MS;
                return (
                <Card key={group.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Link href={`/studygroups/${group.id}`} className="hover:underline">
                        <CardTitle>{group.name}</CardTitle>
                      </Link>
                      <Badge>New</Badge>
                    </div>
                    <Badge variant="secondary" className="w-fit">{group.topic}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-4 h-10 overflow-hidden">{group.description}</p>
                      <div className="flex flex-col text-sm text-muted-foreground gap-2">
                          <div className="flex items-center"><Users className="w-4 h-4 mr-2" /> {group.memberIds.length} / 25 Members</div>
                          <Badge variant="outline" className="w-fit">{group.commitment}</Badge>
                          <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> Created: {formatTimestamp(group.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                       {isNew && <JoinGroupButton group={group} />}
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          ) : (
             !isLoading && <p className="text-muted-foreground">No new groups at this time.</p>
          )}
        </section>
        
        {/* In Progress Groups Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold w-fit border-b-4 border-foreground">In Progress</h2>
          {!isLoading && filteredGroups.inProgressGroups && filteredGroups.inProgressGroups.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.inProgressGroups.map(group => (
                <Card key={group.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Link href={`/studygroups/${group.id}`} className="hover:underline">
                          <CardTitle>{group.name}</CardTitle>
                      </Link>
                      <Badge variant="secondary">In Progress</Badge>
                    </div>
                    <Badge variant="secondary" className="w-fit">{group.topic}</Badge>
                  </CardHeader>
                   <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                    <p className="text-sm text-muted-foreground h-10 overflow-hidden flex-grow">{group.description}</p>
                    <div className="flex flex-col text-sm text-muted-foreground gap-2">
                      <div className="flex items-center"><Users className="w-4 h-4 mr-2" /> {group.memberIds.length} / 25 Members</div>
                      <Badge variant="outline" className="w-fit">{group.commitment}</Badge>
                      <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> Created: {formatTimestamp(group.createdAt)}</div>
                    </div>
                    <JoinGroupButton group={group} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            !isLoading && <p className="text-muted-foreground">No in-progress groups at this time.</p>
          )}
        </section>
      </div>
    </div>
  );
}
