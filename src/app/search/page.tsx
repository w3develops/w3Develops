
'use client';

import { Suspense, useMemo, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function SearchResultsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-96 bg-muted rounded"></div>
      
      <div className="h-10 w-full bg-muted rounded-md mb-4"></div>
      
      <section>
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
    </div>
  )
}

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q');
  const firestore = useFirestore();

  const [topicFilter, setTopicFilter] = useState('');
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
  
  const groupsByNameQuery = useMemo(() => {
    if (!lowerQ) return null;
    return query(
        collection(firestore, 'studyGroups'), 
        orderBy('name_lowercase'),
        where('name_lowercase', '>=', lowerQ),
        where('name_lowercase', '<=', lowerQ + '\uf8ff'),
        limit(20)
    ) as Query<StudyGroup>;
  }, [lowerQ, firestore]);
  
  const bookClubsByNameQuery = useMemo(() => {
    if (!lowerQ) return null;
    return query(
        collection(firestore, 'bookClubs'),
        orderBy('name_lowercase'),
        where('name_lowercase', '>=', lowerQ),
        where('name_lowercase', '<=', lowerQ + '\uf8ff'),
        limit(20)
    ) as Query<BookClub>;
    }, [lowerQ, firestore]);

  const groupProjectsByNameQuery = useMemo(() => {
    if (!lowerQ) return null;
    return query(
        collection(firestore, 'groupProjects'), 
        orderBy('name_lowercase'),
        where('name_lowercase', '>=', lowerQ),
        where('name_lowercase', '<=', lowerQ + '\uf8ff'),
        limit(20)
    ) as Query<GroupProject>;
  }, [lowerQ, firestore]);


  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: groups, isLoading: groupsLoading } = useCollection<StudyGroup>(groupsByNameQuery);
  const { data: bookClubs, isLoading: bookClubsLoading } = useCollection<BookClub>(bookClubsByNameQuery);
  const { data: groupProjects, isLoading: groupProjectsLoading } = useCollection<GroupProject>(groupProjectsByNameQuery);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    if (!topicFilter) return groups;
    return groups.filter(group => group.topic === topicFilter);
  }, [groups, topicFilter]);

  const filteredBookClubs = useMemo(() => {
    if (!bookClubs) return [];
    if (!topicFilter) return bookClubs;
    return bookClubs.filter(club => club.topic === topicFilter);
  }, [bookClubs, topicFilter]);

  const filteredGroupProjects = useMemo(() => {
    if (!groupProjects) return [];
    if (!topicFilter) return groupProjects;
    return groupProjects.filter(project => project.topic === topicFilter);
  }, [groupProjects, topicFilter]);

  const isLoading = usersLoading || groupsLoading || bookClubsLoading || groupProjectsLoading;
  const noResults = !isLoading && !users?.length && !filteredGroups.length && !filteredGroupProjects.length && !filteredBookClubs.length;

  if (!q) {
    return <div className="text-center text-muted-foreground">Please enter a search term to begin.</div>;
  }
  
  if (isLoading) {
    return <SearchResultsSkeleton />;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline">Search Results for &quot;{q}&quot;</h1>
      
      <div className="w-full md:w-1/3">
        <Select value={topicFilter} onValueChange={(value) => setTopicFilter(value === 'all-topics' ? '' : value)}>
            <SelectTrigger>
                <SelectValue placeholder="Filter by topic..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all-topics">All Topics</SelectItem>
                {topics.map(topic => (
                    <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      {noResults ? (
        <div className="text-center py-12">
            <h3 className="text-xl font-semibold">No Results Found</h3>
            <p className="text-muted-foreground mt-2">We couldn't find anything matching your search and filter criteria.</p>
        </div>
      ) : (
        <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="users">Users ({users?.length || 0})</TabsTrigger>
                <TabsTrigger value="studyGroups">Study Groups ({filteredGroups.length})</TabsTrigger>
                <TabsTrigger value="bookClubs">Book Clubs ({filteredBookClubs.length})</TabsTrigger>
                <TabsTrigger value="groupProjects">Group Projects ({filteredGroupProjects.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="pt-6">
                {users && users.length > 0 ? (
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
                ) : (
                    <p className="text-muted-foreground text-center py-8">No users found.</p>
                )}
            </TabsContent>

            <TabsContent value="studyGroups" className="pt-6">
                {filteredGroups.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredGroups.map(group => {
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
                ) : (
                    <p className="text-muted-foreground text-center py-8">No study groups found.</p>
                )}
            </TabsContent>
            
            <TabsContent value="bookClubs" className="pt-6">
                {filteredBookClubs.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredBookClubs.map(club => {
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
                 ) : (
                    <p className="text-muted-foreground text-center py-8">No book clubs found.</p>
                )}
            </TabsContent>
            
            <TabsContent value="groupProjects" className="pt-6">
                {filteredGroupProjects.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredGroupProjects.map(groupProject => {
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
                ) : (
                    <p className="text-muted-foreground text-center py-8">No group projects found.</p>
                )}
            </TabsContent>

        </Tabs>
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
