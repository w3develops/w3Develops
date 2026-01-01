
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useUser, useFirestore } from '@/firebase';
import { collection, Query, orderBy, where, limit, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Cohort } from '@/lib/types';
import { Github, Users, Search, CalendarDays, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatTimestamp } from '@/lib/utils';
import { ONE_WEEK_IN_MS } from '@/lib/constants';
import { JoinCohortModal } from '@/components/modals/JoinCohortModal';
import JoinCohortButton from '@/components/JoinCohortButton';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';

function CohortCardSkeleton() {
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
        <div className="flex gap-2 items-center mt-4">
          <div className="h-9 w-28 bg-muted rounded-md"></div>
          <div className="h-9 w-28 bg-muted rounded-md"></div>
        </div>
      </CardContent>
    </Card>
  );
}

function CohortsPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CohortCardSkeleton />
        <CohortCardSkeleton />
        <CohortCardSkeleton />
      </div>
    </div>
  )
}

export default function GroupProjectsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const oneWeekAgo = useMemo(() => new Date(Date.now() - ONE_WEEK_IN_MS), []);

  const newCohortsQuery = useMemo(() => {
    return query(
      collection(firestore, 'cohorts'),
      orderBy('createdAt', 'desc'),
      where('createdAt', '>', oneWeekAgo),
      limit(25)
    ) as Query;
  }, [firestore, oneWeekAgo]);

  const inProgressCohortsQuery = useMemo(() => {
    return query(
      collection(firestore, 'cohorts'),
      orderBy('createdAt', 'desc'),
      where('createdAt', '<=', oneWeekAgo),
      limit(50)
    ) as Query;
  }, [firestore, oneWeekAgo]);

  const { data: newCohorts, isLoading: isLoadingNew } = useCollection<Cohort>(newCohortsQuery);
  const { data: inProgressCohorts, isLoading: isLoadingInProgress } = useCollection<Cohort>(inProgressCohortsQuery);

  const filteredCohorts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return { newCohorts, inProgressCohorts };

    return {
      newCohorts: newCohorts?.filter(c => c.name_lowercase.includes(term) || c.topic.toLowerCase().includes(term)),
      inProgressCohorts: inProgressCohorts?.filter(c => c.name_lowercase.includes(term) || c.topic.toLowerCase().includes(term)),
    };
  }, [searchTerm, newCohorts, inProgressCohorts]);

  const isLoading = isLoadingNew || isLoadingInProgress;

  return (
    <div className="p-4 md:p-10">
      <JoinCohortModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-headline">Group Projects</h1>
            <p className="text-muted-foreground">Explore groups building projects in the w3Develops community.</p>
          </div>
          {user && (
            <div className="flex gap-2 flex-shrink-0">
               <Button onClick={() => setIsModalOpen(true)}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Join a Group Project
              </Button>
              <Button asChild variant="secondary">
                  <Link href="/groupprojects/create">Create a Group Project</Link>
              </Button>
            </div>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by project name or topic..."
            className="pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading && <CohortsPageSkeleton />}
        
        {!isLoading && !filteredCohorts.newCohorts?.length && !filteredCohorts.inProgressCohorts?.length && searchTerm && (
          <div className="text-center py-12">
              <h3 className="text-xl font-semibold">No Group Projects Found</h3>
              <p className="text-muted-foreground mt-2">Try a different search term.</p>
          </div>
        )}

        {/* New Cohorts Section */}
        <section className="space-y-4">
          <h2 className="pb-2 text-2xl font-semibold w-fit border-b-4 border-foreground">New</h2>
          {!isLoading && filteredCohorts.newCohorts && filteredCohorts.newCohorts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCohorts.newCohorts.map(cohort => {
                const isNew = cohort.createdAt && (Date.now() - cohort.createdAt.toMillis()) < ONE_WEEK_IN_MS;
                return(
                <Card key={cohort.id} className="flex flex-col">
                  <CardHeader>
                    <div className='flex justify-between items-start'>
                       <Link href={`/groupprojects/${cohort.id}`} className="hover:underline">
                        <CardTitle>{cohort.name}</CardTitle>
                      </Link>
                      <Badge>New</Badge>
                    </div>
                     <Badge variant="secondary" className="w-fit text-center">{cohort.topic}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-4 h-10 overflow-hidden">{cohort.description}</p>
                         <div className="flex flex-col text-sm text-muted-foreground gap-2">
                          <div className="flex items-center"><Users className="w-4 h-4 mr-2" /> {cohort.memberIds.length} / 25 Members</div>
                          <Badge variant="outline" className="w-fit">{cohort.commitment}</Badge>
                          <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> Created: {formatTimestamp(cohort.createdAt)}</div>
                        </div>
                      </div>
                    <div className="flex gap-2 items-center">
                      {cohort.githubUrl && (
                          <Button variant="outline" asChild size="sm">
                              <a href={cohort.githubUrl} target="_blank" rel="noopener noreferrer">
                                  <Github className="w-4 h-4 mr-2" />
                                  View on GitHub
                              </a>
                          </Button>
                      )}
                      {isNew && <JoinCohortButton cohort={cohort} />}
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          ) : (
             !isLoading && <p className="text-muted-foreground">No new group projects at this time.</p>
          )}
        </section>

        {/* In Progress Cohorts Section */}
        <section className="space-y-4">
          <h2 className="pb-2 text-2xl font-semibold w-fit border-b-4 border-foreground">In Progress</h2>
          {!isLoading && filteredCohorts.inProgressCohorts && filteredCohorts.inProgressCohorts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCohorts.inProgressCohorts.map(cohort => (
                <Card key={cohort.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Link href={`/groupprojects/${cohort.id}`} className="hover:underline">
                        <CardTitle>{cohort.name}</CardTitle>
                      </Link>
                      <Badge variant="secondary">In Progress</Badge>
                    </div>
                    <Badge variant="secondary" className="w-fit text-center">{cohort.topic}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                      <div>
                          <p className="text-sm text-muted-foreground mb-4 h-10 overflow-hidden">{cohort.description}</p>
                          <div className="flex flex-col text-sm text-muted-foreground gap-2">
                                  <div className="flex items-center"><Users className="w-4 h-4 mr-2" /> {cohort.memberIds.length} / 25 Members</div>
                                  <Badge variant="outline" className="w-fit">{cohort.commitment}</Badge>
                                  <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> Created: {formatTimestamp(cohort.createdAt)}</div>
                          </div>
                      </div>
                    <div className="flex gap-2 items-center">
                      {cohort.githubUrl && (
                          <Button variant="outline" asChild size="sm">
                              <a href={cohort.githubUrl} target="_blank" rel="noopener noreferrer">
                                  <Github className="w-4 h-4 mr-2" />
                                  View on GitHub
                              </a>
                          </Button>
                      )}
                      <JoinCohortButton cohort={cohort} />
                      </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
             !isLoading && <p className="text-muted-foreground">No in-progress group projects at this time.</p>
          )}
        </section>
      </div>
    </div>
  );
}

    