
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { useConnections } from '@/lib/hooks/useConnections';
import { Task, UserProfile, Group, Mentorship, Tutorship, Pairing } from '@/lib/types';
import { collection, query, where, orderBy, getDocs, doc, documentId, DocumentReference, Query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

type ParentDoc = Group | Mentorship | Tutorship | Pairing;

const priorityColors = {
  high: 'text-red-500',
  medium: 'text-yellow-600',
  low: 'text-green-500',
};

// Component to render a list of tasks for a given category (e.g., Study Groups)
function CategoryTaskList({ collectionPath, route, groupIds, categoryTitle }: { collectionPath: string, route: string, groupIds: string[], categoryTitle: string }) {
    const firestore = useFirestore();
    const [tasksByGroup, setTasksByGroup] = useState<Map<string, { parent: ParentDoc, tasks: Task[] }>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            if (groupIds.length === 0) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);

            try {
                const parentDocsSnap = await getDocs(query(collection(firestore, collectionPath), where(documentId(), 'in', groupIds.slice(0, 30))));
                const parents = new Map<string, ParentDoc>();
                parentDocsSnap.forEach(doc => parents.set(doc.id, { id: doc.id, ...doc.data() } as ParentDoc));

                const newTasksByGroup = new Map<string, { parent: ParentDoc, tasks: Task[] }>();
                
                for (const [parentId, parentDoc] of parents.entries()) {
                    const tasksQuery = query(collection(firestore, collectionPath, parentId, 'tasks'), orderBy('position', 'asc'));
                    const tasksSnap = await getDocs(tasksQuery);
                    const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
                    
                    if (tasks.length > 0) {
                        newTasksByGroup.set(parentId, { parent: parentDoc, tasks });
                    }
                }
                setTasksByGroup(newTasksByGroup);
            } catch (error) {
                console.error(`Error fetching tasks for ${collectionPath}:`, error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTasks();
    }, [collectionPath, groupIds, firestore]);

    if (isLoading) {
        return <p>Loading tasks...</p>;
    }

    if (tasksByGroup.size === 0) {
        return <p className="text-muted-foreground text-center py-4">No tasks found in your {categoryTitle}.</p>;
    }

    return (
        <Accordion type="multiple" className="w-full space-y-4">
            {Array.from(tasksByGroup.entries()).map(([groupId, { parent, tasks }]) => (
                <AccordionItem key={groupId} value={groupId} className="border rounded-lg bg-card">
                    <AccordionTrigger className="px-4 hover:no-underline">
                        {/* Solo projects have no page of their own; they're all on /solo-projects */}
                        <Link href={collectionPath === 'soloProjects' ? route : `${route}/${groupId}`} className="font-semibold hover:underline">
                            {('name' in parent && parent.name) || `Session from ${parent.createdAt ? new Date(parent.createdAt.seconds * 1000).toLocaleDateString() : ''}` }
                        </Link>
                    </AccordionTrigger>
                    <AccordionContent className="px-4">
                        <div className="space-y-2">
                             {tasks.filter(task => !task.isCompleted).map(task => (
                                <div key={task.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50">
                                     <Checkbox id={`task-${task.id}`} checked={task.isCompleted} disabled />
                                     <label htmlFor={`task-${task.id}`} className="flex-1 text-sm">{task.description}</label>
                                     <span className={cn("font-semibold text-xs", priorityColors[task.priority])}>{task.priority}</span>
                                </div>
                            ))}
                            {tasks.filter(task => task.isCompleted).map(task => (
                                <div key={task.id} className="flex items-center gap-2 p-2 opacity-60 rounded-md hover:bg-accent/50">
                                     <Checkbox id={`task-${task.id}`} checked={task.isCompleted} disabled />
                                     <label htmlFor={`task-${task.id}`} className="flex-1 text-sm line-through">{task.description}</label>
                                      <span className="text-xs">{timeAgo(task.completedAt)}</span>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}

// Main page component
export default function MyTasksPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

     useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login?redirect=/account/my-tasks');
        }
    }, [user, isUserLoading, router]);

    // A group's member list is the record of who belongs to it
    const memberOf = (collectionName: string) => user
        ? query(collection(firestore, collectionName), where('memberIds', 'array-contains', user.uid)) as Query<Group>
        : null;
    const studyGroupsQuery = useMemo(() => memberOf('studyGroups'), [user, firestore]); // eslint-disable-line react-hooks/exhaustive-deps
    const groupProjectsQuery = useMemo(() => memberOf('groupProjects'), [user, firestore]); // eslint-disable-line react-hooks/exhaustive-deps
    const bookClubsQuery = useMemo(() => memberOf('bookClubs'), [user, firestore]); // eslint-disable-line react-hooks/exhaustive-deps
    const { data: studyGroups } = useCollection<Group>(studyGroupsQuery);
    const { data: groupProjects } = useCollection<Group>(groupProjectsQuery);
    const { data: bookClubs } = useCollection<Group>(bookClubsQuery);
    // Meetups they're going to, and their own solo projects
    const meetupsQuery = useMemo(() => (user ? query(collection(firestore, 'meetups'), where('attendeeIds', 'array-contains', user.uid)) : null), [user, firestore]);
    const soloProjectsQuery = useMemo(() => (user ? query(collection(firestore, 'soloProjects'), where('userId', '==', user.uid)) : null), [user, firestore]);
    const { data: meetups } = useCollection<{ id: string }>(meetupsQuery);
    const { data: soloProjects } = useCollection<{ id: string }>(soloProjectsQuery);
    const meetupIds = useMemo(() => (meetups || []).map(m => m.id), [meetups]);
    const soloProjectIds = useMemo(() => (soloProjects || []).map(p => p.id), [soloProjects]);
    const studyGroupIds = useMemo(() => (studyGroups || []).map(g => g.id), [studyGroups]);
    const groupProjectIds = useMemo(() => (groupProjects || []).map(g => g.id), [groupProjects]);
    const bookClubIds = useMemo(() => (bookClubs || []).map(g => g.id), [bookClubs]);
    
    // Likewise, a connection's member list is the record of who's in it
    const { data: mentorships } = useConnections('mentorships', user?.uid);
    const { data: tutorships } = useConnections('tutorships', user?.uid);
    const { data: pairings } = useConnections('pairings', user?.uid);
    const mentorshipIds = useMemo(() => (mentorships || []).map(c => c.id), [mentorships]);
    const tutorshipIds = useMemo(() => (tutorships || []).map(c => c.id), [tutorships]);
    const pairingIds = useMemo(() => (pairings || []).map(c => c.id), [pairings]);

    if (isUserLoading || isProfileLoading || !userProfile) {
        return <LoadingSkeleton />;
    }

    const tabsData = [
        { value: 'studyGroups', title: 'Study Groups', ids: studyGroupIds, path: 'studyGroups', route: '/studygroups' },
        { value: 'groupProjects', title: 'Group Projects', ids: groupProjectIds, path: 'groupProjects', route: '/groupprojects' },
        { value: 'bookClubs', title: 'Book Clubs', ids: bookClubIds, path: 'bookClubs', route: '/book-clubs' },
        { value: 'soloProjects', title: 'Solo Projects', ids: soloProjectIds, path: 'soloProjects', route: '/solo-projects' },
        { value: 'meetups', title: 'Meetups', ids: meetupIds, path: 'meetups', route: '/meetups' },
        { value: 'mentorships', title: 'Mentorships', ids: mentorshipIds, path: 'mentorships', route: '/mentorships' },
        { value: 'tutorships', title: 'Tutorships', ids: tutorshipIds, path: 'tutorships', route: '/tutorships' },
        { value: 'pairings', title: 'Pairings', ids: pairingIds, path: 'pairings', route: '/pairings' },
    ].filter(tab => tab.ids.length > 0);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">My Tasks</CardTitle>
                    <CardDescription>A centralized view of all your tasks across w3Develops.</CardDescription>
                </CardHeader>
                <CardContent>
                    {tabsData.length > 0 ? (
                        <Tabs defaultValue={tabsData[0].value}>
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto flex-wrap">
                                {tabsData.map(tab => <TabsTrigger key={tab.value} value={tab.value}>{tab.title}</TabsTrigger>)}
                            </TabsList>
                            {tabsData.map(tab => (
                                <TabsContent key={tab.value} value={tab.value} className="pt-4">
                                    <CategoryTaskList collectionPath={tab.path} route={tab.route} groupIds={tab.ids} categoryTitle={tab.title} />
                                </TabsContent>
                            ))}
                        </Tabs>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">You are not a part of any groups or projects with tasks.</p>
                            <Button asChild variant="link"><Link href="/explore">Explore groups and projects</Link></Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
