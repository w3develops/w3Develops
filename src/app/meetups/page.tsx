
'use client';

import { useMemo, useState } from 'react';
import { useCollection, useUser, useFirestore } from '@/firebase';
import { collection, Query, orderBy, where, limit, query, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Meetup } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Users, Search, CalendarDays, PlusCircle, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatTimestamp } from '@/lib/utils';
import JoinMeetupButton from '@/components/JoinMeetupButton';

function MeetupCardSkeleton() {
  return (
    <Card className="flex flex-col animate-pulse">
      <CardHeader>
        <div className="h-6 w-3/4 bg-muted rounded"></div>
        <div className="flex gap-2 mt-2">
            <div className="h-5 w-24 bg-muted rounded-full"></div>
            <div className="h-5 w-20 bg-muted rounded-full"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
          <div>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-5/6 mb-4"></div>
            <div className="space-y-2">
              <div className="h-5 w-36 bg-muted rounded"></div>
              <div className="h-5 w-44 bg-muted rounded"></div>
            </div>
          </div>
        <div className="h-9 w-28 bg-muted rounded-md mt-4"></div>
      </CardContent>
    </Card>
  );
}

function MeetupsPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MeetupCardSkeleton />
        <MeetupCardSkeleton />
        <MeetupCardSkeleton />
      </div>
    </div>
  )
}

export default function MeetupsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');

  const upcomingMeetupsQuery = useMemo(() => {
    return query(
      collection(firestore, 'meetups'),
      where('dateTime', '>=', Timestamp.now()),
      orderBy('dateTime', 'asc'),
      limit(50)
    ) as Query<Meetup>;
  }, [firestore]);

  const pastMeetupsQuery = useMemo(() => {
    return query(
      collection(firestore, 'meetups'),
      where('dateTime', '<', Timestamp.now()),
      orderBy('dateTime', 'desc'),
      limit(10)
    ) as Query<Meetup>;
  }, [firestore]);

  const { data: upcomingMeetups, isLoading: isLoadingUpcoming } = useCollection<Meetup>(upcomingMeetupsQuery);
  const { data: pastMeetups, isLoading: isLoadingPast } = useCollection<Meetup>(pastMeetupsQuery);

  const filteredUpcoming = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return upcomingMeetups;
    return upcomingMeetups?.filter(m => m.name_lowercase.includes(term) || m.topic.toLowerCase().includes(term) || m.locationAddress?.toLowerCase().includes(term));
  }, [searchTerm, upcomingMeetups]);
  
  const filteredPast = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return pastMeetups;
    return pastMeetups?.filter(m => m.name_lowercase.includes(term) || m.topic.toLowerCase().includes(term) || m.locationAddress?.toLowerCase().includes(term));
  }, [searchTerm, pastMeetups]);


  const isLoading = isLoadingUpcoming || isLoadingPast;

  return (
    <div className="p-4 md:p-10">
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-headline">Explore Meetups</h1>
            <p className="text-muted-foreground">Find local and online events to connect with the community.</p>
          </div>
          {user && (
            <div className="flex gap-2 flex-shrink-0">
              <Button asChild>
                  <Link href="/meetups/create">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create a Meetup
                  </Link>
              </Button>
            </div>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by name, topic, or location..."
            className="pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading && <MeetupsPageSkeleton />}
        
        {!isLoading && !filteredUpcoming?.length && !filteredPast?.length && searchTerm && (
          <div className="text-center py-12">
              <h3 className="text-xl font-semibold">No Meetups Found</h3>
              <p className="text-muted-foreground mt-2">Try a different search term.</p>
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold w-fit border-b-4 border-foreground">Upcoming Meetups</h2>
          {!isLoading && filteredUpcoming && filteredUpcoming.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredUpcoming.map(meetup => (
                <Card key={meetup.id} className="flex flex-col">
                  <CardHeader>
                    <Link href={`/meetups/${meetup.id}`} className="hover:underline">
                      <CardTitle>{meetup.name}</CardTitle>
                    </Link>
                     <div className="flex items-center gap-2 pt-2">
                        <Badge variant="secondary">{meetup.topic}</Badge>
                        <Badge variant="outline">{meetup.locationType}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                    <p className="text-sm text-muted-foreground h-10 overflow-hidden">{meetup.description}</p>
                    <div className="flex flex-col text-sm text-muted-foreground gap-2">
                      <div className="flex items-center"><Users className="w-4 h-4 mr-2" /> {meetup.attendeeIds.length} Attendees</div>
                      <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" />{formatTimestamp(meetup.dateTime, true)}</div>
                      {meetup.locationAddress && meetup.locationType !== 'Online' && (
                        <div className="flex items-center"><MapPin className="w-4 h-4 mr-2" />{meetup.locationAddress}</div>
                      )}
                    </div>
                    <JoinMeetupButton meetup={meetup} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
             !isLoading && <p className="text-muted-foreground">No upcoming meetups scheduled. Why not <Link href="/meetups/create" className="underline">create one</Link>?</p>
          )}
        </section>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold w-fit border-b-4 border-foreground">Past Meetups</h2>
          {!isLoading && filteredPast && filteredPast.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPast.map(meetup => (
                <Card key={meetup.id} className="flex flex-col opacity-70">
                   <CardHeader>
                    <Link href={`/meetups/${meetup.id}`} className="hover:underline">
                      <CardTitle>{meetup.name}</CardTitle>
                    </Link>
                     <div className="flex items-center gap-2 pt-2">
                        <Badge variant="secondary">{meetup.topic}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                     <p className="text-sm text-muted-foreground h-10 overflow-hidden">{meetup.description}</p>
                     <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" />{formatTimestamp(meetup.dateTime, true)}</div>
                     <Button asChild variant="secondary" size="sm"><Link href={`/meetups/${meetup.id}`}>View Details</Link></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            !isLoading && <p className="text-muted-foreground">No past meetups found.</p>
          )}
        </section>
      </div>
    </div>
  );
}
