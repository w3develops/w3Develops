
'use client';

import { useMemo, useState } from 'react';
import { useCollection, useUser, useFirestore } from '@/firebase';
import { collection, Query, orderBy, where, limit, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookClub } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Users, Search, CalendarDays, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatTimestamp } from '@/lib/utils';
import { ONE_WEEK_IN_MS } from '@/lib/constants';
import { JoinBookClubModal } from '@/components/modals/JoinBookClubModal';
import JoinBookClubButton from '@/components/JoinBookClubButton';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';

function ClubCardSkeleton() {
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

function BookClubsPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ClubCardSkeleton />
        <ClubCardSkeleton />
        <ClubCardSkeleton />
      </div>
    </div>
  )
}

export default function BookClubsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const oneWeekAgo = useMemo(() => new Date(Date.now() - ONE_WEEK_IN_MS), []);

  const newClubsQuery = useMemo(() => {
    return query(
        collection(firestore, 'bookClubs'), 
        orderBy('createdAt', 'desc'),
        where('createdAt', '>', oneWeekAgo),
        limit(25)
    ) as Query;
  }, [firestore, oneWeekAgo]);

  const inProgressClubsQuery = useMemo(() => {
    return query(
        collection(firestore, 'bookClubs'),
        orderBy('createdAt', 'desc'),
        where('createdAt', '<=', oneWeekAgo),
        limit(50)
    ) as Query;
  }, [firestore, oneWeekAgo]);

  const { data: newClubs, isLoading: isLoadingNew } = useCollection<BookClub>(newClubsQuery);
  const { data: inProgressClubs, isLoading: isLoadingInProgress } = useCollection<BookClub>(inProgressClubsQuery);

  const filteredClubs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return { newClubs, inProgressClubs };
    
    return {
        newClubs: newClubs?.filter(g => g.name_lowercase.includes(term) || g.topic.toLowerCase().includes(term)),
        inProgressClubs: inProgressClubs?.filter(g => g.name_lowercase.includes(term) || g.topic.toLowerCase().includes(term))
    }
  }, [searchTerm, newClubs, inProgressClubs]);

  const isLoading = isLoadingNew || isLoadingInProgress;

  return (
    <div className="p-4 md:p-10">
      <JoinBookClubModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-headline">Explore Book Clubs</h1>
            <p className="text-muted-foreground">Find a club to read and grow with.</p>
          </div>
          {user && (
            <div className="flex gap-2 flex-shrink-0">
               <Button onClick={() => setIsModalOpen(true)}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Join a Club
              </Button>
              <Button asChild variant="secondary">
                  <Link href="/book-clubs/create">Create a Club</Link>
              </Button>
            </div>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by club name or topic..."
            className="pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading && <BookClubsPageSkeleton />}
        
        {!isLoading && !filteredClubs.newClubs?.length && !filteredClubs.inProgressClubs?.length && searchTerm && (
          <div className="text-center py-12">
              <h3 className="text-xl font-semibold">No Book Clubs Found</h3>
              <p className="text-muted-foreground mt-2">Try a different search term.</p>
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold w-fit border-b-4 border-foreground">New</h2>
          {!isLoading && filteredClubs.newClubs && filteredClubs.newClubs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredClubs.newClubs.map(club => {
                const isNew = club.createdAt && (Date.now() - club.createdAt.toMillis()) < ONE_WEEK_IN_MS;
                return (
                <Card key={club.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Link href={`/book-clubs/${club.id}`} className="hover:underline">
                        <CardTitle>{club.name}</CardTitle>
                      </Link>
                      <Badge>New</Badge>
                    </div>
                    <Badge variant="secondary" className="w-fit">{club.topic}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-4 h-10 overflow-hidden">{club.description}</p>
                      <div className="flex flex-col text-sm text-muted-foreground gap-2">
                          <div className="flex items-center"><Users className="w-4 h-4 mr-2" /> {club.memberIds.length} / 25 Members</div>
                          <Badge variant="outline" className="w-fit">{club.commitment}</Badge>
                          <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> Created: {formatTimestamp(club.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                       {isNew && <JoinBookClubButton club={club} />}
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          ) : (
             !isLoading && <p className="text-muted-foreground">No new book clubs at this time.</p>
          )}
        </section>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold w-fit border-b-4 border-foreground">In Progress</h2>
          {!isLoading && filteredClubs.inProgressClubs && filteredClubs.inProgressClubs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredClubs.inProgressClubs.map(club => (
                <Card key={club.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Link href={`/book-clubs/${club.id}`} className="hover:underline">
                          <CardTitle>{club.name}</CardTitle>
                      </Link>
                      <Badge variant="secondary">In Progress</Badge>
                    </div>
                    <Badge variant="secondary" className="w-fit">{club.topic}</Badge>
                  </CardHeader>
                   <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                    <p className="text-sm text-muted-foreground h-10 overflow-hidden flex-grow">{club.description}</p>
                    <div className="flex flex-col text-sm text-muted-foreground gap-2">
                      <div className="flex items-center"><Users className="w-4 h-4 mr-2" /> {club.memberIds.length} / 25 Members</div>
                      <Badge variant="outline" className="w-fit">{club.commitment}</Badge>
                      <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> Created: {formatTimestamp(club.createdAt)}</div>
                    </div>
                    <JoinBookClubButton club={club} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            !isLoading && <p className="text-muted-foreground">No in-progress book clubs at this time.</p>
          )}
        </section>
      </div>
    </div>
  );
}

    