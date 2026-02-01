
'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, limit, Query, DocumentData } from 'firebase/firestore';
import { UserProfile, StudyGroup, GroupProject, BookClub } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, CalendarDays } from 'lucide-react';
import { topics, ONE_WEEK_IN_MS } from '@/lib/constants';
import { formatTimestamp } from '@/lib/utils';

function SearchResultsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-96 bg-muted rounded"></div>
      
      {/* Users Skeleton */}
      <section>
        <div className="h-7 w-24 bg-muted rounded mb-4"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-full bg-muted h-12 w-12"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      </section>

      {/* Groups Skeleton */}
      <section>
        <div className="h-7 w-36 bg-muted rounded mb-4"></div>
        <div className="grid gap-6 md:grid-cols-2">
           {[...Array(2)].map((_, i) => (
            <Card key={i}><CardHeader>
              <div className="h-6 w-48 bg-muted rounded"></div>
              <div className="h-5 w-24 bg-muted rounded-full mt-2"></div>
            </CardHeader><CardContent className="space-y-3">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="flex items-center gap-4 mt-4">
                <div className="h-5 w-32 bg-muted rounded"></div>
                <div className="h-6 w-28 bg-muted rounded-full"></div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      </section>
    </div>
  )
}

// Helper to merge and deduplicate results
function mergeResults<T extends { id: string }>(...arrays: (T[] | null | undefined)[]): T[] {
  const map = new Map<string, T>();
  for (const arr of arrays) {
    if (arr) {
      for (const item of arr) {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
      }
    }
  }
  return Array.from(map.values());
}


function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q');
  const firestore = useFirestore();

  const lowerQ = useMemo(() => q?.toLowerCase(), [q]);

  const usersQuery = useMemo(() => {
    if (!lowerQ) return null;
    return query(
        collection(firestore, 'users'), 
        orderBy('username_lowercase'),
        where('username_lowercase', '>=', lowerQ),
        where('username_lowercase', '<=', lowerQ + '\uf8ff'),
        limit(10)
    ) as Query<UserProfile>;
  }, [lowerQ, firestore]);
  
  // --- Groups Queries ---
  const groupsByNameQuery = useMemo(() => {
    if (!lowerQ) return null;
    return query(
        collection(firestore, 'studyGroups'), 
        orderBy('name_lowercase'),
        where('name_lowercase', '>=', lowerQ),
        where('name_lowercase', '<=', lowerQ + '\uf8ff'),
        limit(10)
    ) as Query<StudyGroup>;
  }, [lowerQ, firestore]);

  const groupsByTopicQuery = useMemo(() => {
    if (!q) return null;
    const matchingTopic = topics.find(topic => topic.toLowerCase() === q.toLowerCase());
    if (!matchingTopic) return null;

    return query(
        collection(firestore, 'studyGroups'), 
        where('topic', '==', matchingTopic),
        limit(10)
    ) as Query<StudyGroup>;
  }, [q, firestore]);
  
  // --- Book Clubs Queries ---
  const bookClubsByNameQuery = useMemo(() => {
    if (!lowerQ) return null;
    return query(
        collection(firestore, 'bookClubs'),
        orderBy('name_lowercase'),
        where('name_lowercase', '>=', lowerQ),
        where('name_lowercase', '<=', lowerQ + '\uf8ff'),
        limit(10)
    ) as Query<BookClub>;
    }, [lowerQ, firestore]);

  const bookClubsByTopicQuery = useMemo(() => {
    if (!q) return null;
    const matchingTopic = topics.find(topic => topic.toLowerCase() === q.toLowerCase());
    if (!matchingTopic) return null;

    return query(
        collection(firestore, 'bookClubs'),
        where('topic', '==', matchingTopic),
        limit(10)
    ) as Query<BookClub>;
  }, [q, firestore]);


  // --- GroupProjects Queries ---
  const groupProjectsByNameQuery = useMemo(() => {
    if (!lowerQ) return null;
    return query(
        collection(firestore, 'groupProjects'), 
        orderBy('name_lowercase'),
        where('name_lowercase', '>=', lowerQ),
        where('name_lowercase', '<=', lowerQ + '\uf8ff'),
        limit(10)
    ) as Query<GroupProject>;
  }, [lowerQ, firestore]);

  const groupProjectsByTopicQuery = useMemo(() => {
    if (!q) return null;
    const matchingTopic = topics.find(topic => topic.toLowerCase() === q.toLowerCase());
    if (!matchingTopic) return null;
    
    return query(
        collection(firestore, 'groupProjects'),
        where('topic', '==', matchingTopic),
        limit(10)
    ) as Query<GroupProject>;
  }, [q, firestore]);


  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: groupsByName, isLoading: groupsByNameLoading } = useCollection<StudyGroup>(groupsByNameQuery);
  const { data: groupsByTopic, isLoading: groupsByTopicLoading } = useCollection<StudyGroup>(groupsByTopicQuery);
  const { data: bookClubsByName, isLoading: bookClubsByNameLoading } = useCollection<BookClub>(bookClubsByNameQuery);
  const { data: bookClubsByTopic, isLoading: bookClubsByTopicLoading } = useCollection<BookClub>(bookClubsByTopicQuery);
  const { data: groupProjectsByName, isLoading: groupProjectsByNameLoading } = useCollection<GroupProject>(groupProjectsByNameQuery);
  const { data: groupProjectsByTopic, isLoading: groupProjectsByTopicLoading } = useCollection<GroupProject>(groupProjectsByTopicQuery);

  const mergedGroups = useMemo(() => mergeResults(groupsByName, groupsByTopic), [groupsByName, groupsByTopic]);
  const mergedBookClubs = useMemo(() => mergeResults(bookClubsByName, bookClubsByTopic), [bookClubsByName, bookClubsByTopic]);
  const mergedGroupProjects = useMemo(() => mergeResults(groupProjectsByName, groupProjectsByTopic), [groupProjectsByName, groupProjectsByTopic]);

  const isLoading = usersLoading || groupsByNameLoading || groupsByTopicLoading || bookClubsByNameLoading || bookClubsByTopicLoading || groupProjectsByNameLoading || groupProjectsByTopicLoading;
  const noResults = !isLoading && !users?.length && !mergedGroups.length && !mergedGroupProjects.length && !mergedBookClubs.length;

  if (!q) {
    return <div className="text-center text-muted-foreground">Please enter a search term to begin.</div>;
  }
  
  if (isLoading) {
    return <SearchResultsSkeleton />;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline">Search Results for &quot;{q}&quot;</h1>
      
      {noResults && (
        <div className="text-center py-12">
            <h3 className="text-xl font-semibold">No Results Found</h3>
            <p className="text-muted-foreground mt-2">We couldn't find any users, groups, or projects matching your search.</p>
        </div>
      )}

      {users && users.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Users</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map(user => (
              <Link key={user.id} href={`/users/${user.id}`} className="block">
                <Card className="h-full hover:bg-accent transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.profilePictureUrl} />
                      <AvatarFallback>{user.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.username}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{user.bio}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {mergedGroups.length > 0 && (
         <section>
          <h2 className="text-2xl font-semibold mb-4">Study Groups</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mergedGroups.map(group => {
              const isNew = group.createdAt && (Date.now() - (group.createdAt as any).toMillis()) < ONE_WEEK_IN_MS;
              return (
                <Link href={`/studygroups/${group.id}`} key={group.id}>
                  <Card className="hover:bg-accent transition-colors h-full flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{group.name}</CardTitle>
                        {isNew ? <Badge>New</Badge> : <Badge variant="secondary">In Progress</Badge>}
                      </div>
                      <Badge variant="secondary" className="w-fit">{group.topic}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                        <p className="text-sm text-muted-foreground h-10 overflow-hidden">{group.description}</p>
                        <div className="flex flex-col text-sm text-muted-foreground gap-2">
                            <div className="flex items-center"><Users className="w-4 h-4 mr-2" />{group.memberIds.length} / 25 Members</div>
                            <Badge variant="outline" className="w-fit">{group.commitment}</Badge>
                            <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> Created: {formatTimestamp(group.createdAt as any)}</div>
                        </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {mergedBookClubs.length > 0 && (
         <section>
          <h2 className="text-2xl font-semibold mb-4">Book Clubs</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mergedBookClubs.map(club => {
              const isNew = club.createdAt && (Date.now() - (club.createdAt as any).toMillis()) < ONE_WEEK_IN_MS;
              return (
                <Link href={`/book-clubs/${club.id}`} key={club.id}>
                  <Card className="hover:bg-accent transition-colors h-full flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{club.name}</CardTitle>
                        {isNew ? <Badge>New</Badge> : <Badge variant="secondary">In Progress</Badge>}
                      </div>
                      <Badge variant="secondary" className="w-fit">{club.topic}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                        <p className="text-sm text-muted-foreground h-10 overflow-hidden">{club.description}</p>
                        <div className="flex flex-col text-sm text-muted-foreground gap-2">
                            <div className="flex items-center"><Users className="w-4 h-4 mr-2" />{club.memberIds.length} / 25 Members</div>
                            {club.commitmentHours && <Badge variant="outline" className="w-fit">{club.commitmentHours}hr/day</Badge>}
                            <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> Created: {formatTimestamp(club.createdAt as any)}</div>
                        </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

       {mergedGroupProjects.length > 0 && (
         <section>
          <h2 className="text-2xl font-semibold mb-4">Group Projects</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mergedGroupProjects.map(groupProject => {
              const isNew = groupProject.createdAt && (Date.now() - (groupProject.createdAt as any).toMillis()) < ONE_WEEK_IN_MS;
              return (
               <Link href={`/groupprojects/${groupProject.id}`} key={groupProject.id}>
                <Card className="hover:bg-accent transition-colors h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{groupProject.name}</CardTitle>
                      {isNew ? <Badge>New</Badge> : <Badge variant="secondary">In Progress</Badge>}
                    </div>
                    <Badge variant="secondary" className="w-fit">{groupProject.topic}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                      <p className="text-sm text-muted-foreground h-10 overflow-hidden">{groupProject.description}</p>
                       <div className="flex flex-col text-sm text-muted-foreground gap-2">
                          <div className="flex items-center"><Users className="w-4 h-4 mr-2" />{groupProject.memberIds.length} / 25 Members</div>
                          <Badge variant="outline" className="w-fit">{groupProject.commitment}</Badge>
                          <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> Created: {formatTimestamp(groupProject.createdAt as any)}</div>
                      </div>
                  </CardContent>
                </Card>
               </Link>
              )
            })}
          </div>
        </section>
      )}

    </div>
  );
}


export default function SearchPage() {
    return (
        <Suspense>
            <div className="p-4 md:p-10">
                <SearchResults />
            </div>
        </Suspense>
    )
}

    