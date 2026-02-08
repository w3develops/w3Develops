'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { UserProfile, CheckIn, Task } from '@/lib/types';
import { collection, query, where, orderBy, limit, getDocs, doc, documentId, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { timeAgo } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';
import { MessageSquare, CheckSquare } from 'lucide-react';

type CheckInActivity = CheckIn & {
  parent: { id: string; name: string; path: string };
  activityType: 'check-in';
};

type TaskActivity = Task & {
  parent: { id: string; name: string; path: string };
  activityType: 'task';
};

type ActivityItem = CheckInActivity | TaskActivity;


interface ActivityFeedProps {
    userProfile: UserProfile;
}

const ActivityItemCard = ({ item }: { item: ActivityItem }) => {
    const [ago, setAgo] = useState(() => timeAgo(item.createdAt));

    useEffect(() => {
        const interval = setInterval(() => {
            setAgo(timeAgo(item.createdAt));
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [item.createdAt]);

    const icon = item.activityType === 'check-in' 
        ? <MessageSquare className="h-5 w-5 text-blue-500" /> 
        : <CheckSquare className="h-5 w-5 text-green-500" />;

    const title = item.activityType === 'check-in' 
        ? `New check-in in ` 
        : `New task added to `;
    
    const content = item.activityType === 'check-in' ? item.content : item.description;

    return (
        <div className="flex items-start gap-4 p-3 hover:bg-accent/50 rounded-lg">
            <div className="mt-1">{icon}</div>
            <div className="flex-1">
                <p className="text-sm">
                    {title}
                    <Link href={item.parent.path} className="font-semibold hover:underline">{item.parent.name}</Link>
                </p>
                <blockquote className="mt-1 border-l-2 pl-3 text-sm text-muted-foreground italic">
                    &quot;{content}&quot;
                </blockquote>
                 <p className="text-xs text-muted-foreground mt-1">{ago}</p>
            </div>
        </div>
    )
}

export default function ActivityFeed({ userProfile }: ActivityFeedProps) {
    const firestore = useFirestore();
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const groupIds = useMemo(() => {
        const allIds = [
            ...(userProfile.createdStudyGroupIds || []),
            ...(userProfile.joinedStudyGroupIds || []),
            ...(userProfile.createdGroupProjectIds || []),
            ...(userProfile.joinedGroupProjectIds || []),
            ...(userProfile.createdBookClubIds || []),
            ...(userProfile.joinedBookClubIds || []),
        ];
        return [...new Set(allIds)];
    }, [userProfile]);
    
    const collectionMap = useMemo(() => ({
        studyGroups: 'studyGroups',
        groupProjects: 'groupProjects',
        bookClubs: 'bookClubs',
    }), []);

    useEffect(() => {
        const fetchActivity = async () => {
            if (groupIds.length === 0) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            let allItems: ActivityItem[] = [];
            const parentDocs: { [key: string]: { id: string, name: string, path: string } } = {};
            
            try {
                // 1. Fetch all parent documents to get their names
                const groupTypes = Object.keys(collectionMap) as (keyof typeof collectionMap)[];
                for (const type of groupTypes) {
                    const ids = [
                        ...((userProfile[`created${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof UserProfile] as string[]) || []),
                        ...((userProfile[`joined${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof UserProfile] as string[]) || [])
                    ];
                    if (ids.length > 0) {
                        const docsSnap = await getDocs(query(collection(firestore, collectionMap[type]), where(documentId(), 'in', ids.slice(0,30))));
                        docsSnap.forEach(d => {
                            parentDocs[d.id] = { id: d.id, name: d.data().name, path: `/${collectionMap[type]}/${d.id}` };
                        });
                    }
                }

                // 2. Fetch recent check-ins and tasks for each group
                const threeDaysAgo = Timestamp.fromMillis(Date.now() - 3 * 24 * 60 * 60 * 1000);

                for (const type of groupTypes) {
                    const ids = Object.keys(parentDocs).filter(id => parentDocs[id].path.startsWith(`/${collectionMap[type]}`));
                    if (ids.length === 0) continue;

                    for (const id of ids) {
                         const subcollections = ['checkIns', 'tasks'];
                         for (const sub of subcollections) {
                            const q = query(
                                collection(firestore, collectionMap[type], id, sub),
                                where('createdAt', '>=', threeDaysAgo),
                                orderBy('createdAt', 'desc'),
                                limit(5)
                            );
                            const itemsSnap = await getDocs(q);
                            if (sub === 'checkIns') {
                                itemsSnap.forEach(itemDoc => {
                                    allItems.push({
                                        ...(itemDoc.data() as CheckIn),
                                        id: itemDoc.id,
                                        parent: parentDocs[id],
                                        activityType: 'check-in',
                                    });
                                });
                            } else { // tasks
                                itemsSnap.forEach(itemDoc => {
                                    allItems.push({
                                        ...(itemDoc.data() as Task),
                                        id: itemDoc.id,
                                        parent: parentDocs[id],
                                        activityType: 'task',
                                    });
                                });
                            }
                         }
                    }
                }
                
                // 3. Sort all items by date
                allItems.sort((a, b) => (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis());
                
                setActivity(allItems);

            } catch (error) {
                console.error("Failed to fetch activity feed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivity();
    }, [firestore, groupIds, collectionMap, userProfile]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>What&apos;s been happening in your groups and projects.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                             <div key={i} className="flex items-start gap-4 p-3 animate-pulse">
                                <div className="h-6 w-6 rounded-md bg-muted mt-1"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-muted rounded w-3/4"></div>
                                    <div className="h-6 bg-muted rounded w-full"></div>
                                    <div className="h-3 bg-muted rounded w-1/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activity.length > 0 ? (
                    <div className="space-y-2">
                        {activity.slice(0, 15).map((item) => (
                           <ActivityItemCard key={`${item.parent.id}-${item.activityType}-${item.id}`} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">No recent activity in your groups.</p>
                         <p className="text-sm text-muted-foreground mt-2">Join a group or project to get started!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
