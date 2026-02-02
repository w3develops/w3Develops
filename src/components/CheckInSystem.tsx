'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { CheckIn, UserProfile } from '@/lib/types';
import { collection, query, addDoc, serverTimestamp, where, getDocs, documentId, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from './ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTimestamp, timeAgo } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

interface CheckInSystemProps {
  groupOrCohortId: string;
  collectionPath: 'studyGroups' | 'groupProjects' | 'bookClubs';
  memberIds: string[];
}


function UserCheckInsDisplay({ memberId, memberProfiles, allCheckins, isLoading, type }: { memberId: string, memberProfiles: Map<string, UserProfile>, allCheckins: CheckIn[] | null, isLoading: boolean, type: 'daily' | 'weekly' }) {
    const member = memberProfiles.get(memberId);
    
    const userCheckins = useMemo(() => {
        if (!allCheckins) return [];
        return allCheckins.filter(c => c.userId === memberId);
    }, [allCheckins, memberId]);

    const lastCheckin = useMemo(() => {
        if (userCheckins.length === 0) return null;
        return userCheckins[0]; // Already sorted by most recent
    }, [userCheckins]);
    
    const [timeAgoString, setTimeAgoString] = useState('');

    useEffect(() => {
      if (lastCheckin) {
        setTimeAgoString(timeAgo(lastCheckin.createdAt));
      } else {
        setTimeAgoString('');
      }
    }, [lastCheckin]);


    if (isLoading) {
        return <div>Loading check-ins...</div>;
    }

    return (
        <AccordionItem value={memberId}>
            <AccordionTrigger>
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                        <Link href={`/users/${memberId}`} onClick={(e) => e.stopPropagation()}>
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={member?.profilePictureUrl} />
                                <AvatarFallback>{member?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <span>{member?.username}</span>
                    </div>
                    {timeAgoString && (
                        <p className="text-xs text-muted-foreground mr-4">
                            Last updated: {timeAgoString}
                        </p>
                    )}
                </div>
            </AccordionTrigger>
            <AccordionContent>
                {userCheckins.length > 0 ? (
                    <div className="space-y-3 pl-4 border-l-2 ml-4">
                        {userCheckins.map(checkin => (
                            <div key={checkin.id} className="text-sm">
                                <p className="font-semibold">{formatTimestamp(checkin.createdAt, true)}</p>
                                <p className="text-muted-foreground whitespace-pre-wrap">{checkin.content}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground pl-10">No {type} check-ins from this user yet.</p>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}


export default function CheckInSystem({ groupOrCohortId, collectionPath, memberIds }: CheckInSystemProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [dailyCheckInContent, setDailyCheckInContent] = useState('');
    const [weeklyCheckInContent, setWeeklyCheckInContent] = useState('');
    const [isDailySubmitting, setIsDailySubmitting] = useState(false);
    const [isWeeklySubmitting, setIsWeeklySubmitting] = useState(false);

    const [memberProfiles, setMemberProfiles] = useState<Map<string, UserProfile>>(new Map());

    const isMember = user ? memberIds.includes(user.uid) : false;

    const checkInsCollectionRef = useMemo(() => 
        collection(firestore, collectionPath, groupOrCohortId, 'checkIns'),
        [firestore, collectionPath, groupOrCohortId]
    );
    
    // Fetch checkins by type
    const allDailyCheckinsQuery = useMemo(() => {
        return query(
            checkInsCollectionRef,
            where('type', '==', 'daily')
        );
    }, [checkInsCollectionRef]);

    const allWeeklyCheckinsQuery = useMemo(() => {
        return query(
            checkInsCollectionRef,
            where('type', '==', 'weekly')
        );
    }, [checkInsCollectionRef]);

    const { data: allDailyCheckinsData, isLoading: isLoadingAllDaily } = useCollection<CheckIn>(allDailyCheckinsQuery);
    const { data: allWeeklyCheckinsData, isLoading: isLoadingAllWeekly } = useCollection<CheckIn>(allWeeklyCheckinsQuery);

    // Client-side sorting
    const allDailyCheckins = useMemo(() => {
        if (!allDailyCheckinsData) return null;
        return [...allDailyCheckinsData].sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis()
        });
    }, [allDailyCheckinsData]);
    
    const allWeeklyCheckins = useMemo(() => {
        if (!allWeeklyCheckinsData) return null;
        return [...allWeeklyCheckinsData].sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis()
        });
    }, [allWeeklyCheckinsData]);
    
    
    useEffect(() => {
        const fetchMemberProfiles = async () => {
            if (memberIds.length === 0) return;
            
            const idsToFetch = memberIds.filter(id => !memberProfiles.has(id));
            if (idsToFetch.length === 0) return;
            
            // Firestore 'in' query limit is 30. We chunk it here.
            for (let i = 0; i < idsToFetch.length; i += 30) {
              const chunk = idsToFetch.slice(i, i + 30);
              if (chunk.length === 0) continue;
              
              try {
                  const profilesQuery = query(collection(firestore, 'users'), where(documentId(), 'in', chunk));
                  const snapshot = await getDocs(profilesQuery);
                  const newProfiles = new Map(memberProfiles);
                  snapshot.forEach(docSnap => {
                      newProfiles.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as UserProfile);
                  });
                  setMemberProfiles(newProfiles);
              } catch (error) {
                  console.error("Error fetching member profiles:", error);
              }
            }
        };
        fetchMemberProfiles();
    }, [memberIds, firestore, memberProfiles]);


    const handleSubmitCheckIn = async (type: 'daily' | 'weekly') => {
        const content = type === 'daily' ? dailyCheckInContent : weeklyCheckInContent;
        if (!user || !isMember || !content.trim()) return;
        
        if (type === 'daily') setIsDailySubmitting(true);
        else setIsWeeklySubmitting(true);

        const checkInData = {
            userId: user.uid,
            type: type,
            content: content,
            createdAt: serverTimestamp(),
        };

        const userDocRef = doc(firestore, 'users', user.uid);
        const userUpdateData = {
            status: 'active',
            lastCheckInAt: serverTimestamp(),
        };
        
        try {
            await addDoc(checkInsCollectionRef, checkInData);
            await updateDoc(userDocRef, userUpdateData);

            toast({ title: "Check-in submitted!", description: "Your update has been posted." });
            if (type === 'daily') setDailyCheckInContent('');
            else setWeeklyCheckInContent('');

        } catch (serverError) {
             const permissionError = new FirestorePermissionError({
                path: checkInsCollectionRef.path,
                operation: 'create',
                requestResourceData: checkInData,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
             toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: "Could not save your check-in. Please check your permissions and try again."
            });
        } finally {
             if (type === 'daily') setIsDailySubmitting(false);
             else setIsWeeklySubmitting(false);
        }
    };
    
    if (!isMember) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Check-ins</CardTitle>
                    <CardDescription>See what the team is working on.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="daily" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="daily">Daily Progress</TabsTrigger>
                            <TabsTrigger value="weekly">Weekly Goals</TabsTrigger>
                        </TabsList>
                        <TabsContent value="daily" className="space-y-4 pt-4">
                           {memberIds.length > 0 ? (
                                <Accordion type="multiple" className="w-full">
                                   {memberIds.map(id => (
                                       <UserCheckInsDisplay
                                          key={id} 
                                          memberId={id} 
                                          memberProfiles={memberProfiles} 
                                          allCheckins={allDailyCheckins}
                                          isLoading={isLoadingAllDaily}
                                          type="daily"
                                      />
                                   ))}
                                </Accordion>
                            ) : (
                                <p className="text-sm text-muted-foreground">No members in this group yet.</p>
                            )}
                        </TabsContent>
                        <TabsContent value="weekly" className="space-y-4 pt-4">
                            {memberIds.length > 0 ? (
                                <Accordion type="multiple" className="w-full">
                                   {memberIds.map(id => (
                                       <UserCheckInsDisplay
                                          key={id} 
                                          memberId={id} 
                                          memberProfiles={memberProfiles} 
                                          allCheckins={allWeeklyCheckins}
                                          isLoading={isLoadingAllWeekly}
                                          type="weekly"
                                      />
                                   ))}
                                </Accordion>
                            ) : (
                                <p className="text-sm text-muted-foreground">No members in this group yet.</p>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Check-ins</CardTitle>
                <CardDescription>Post your progress and see what others are up to.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="daily" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="daily">Daily Progress</TabsTrigger>
                        <TabsTrigger value="weekly">Weekly Goals</TabsTrigger>
                    </TabsList>
                    <TabsContent value="daily" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold">What did you work on today?</h3>
                             <Textarea
                                placeholder="Share your progress, challenges, and goals..."
                                value={dailyCheckInContent}
                                onChange={(e) => setDailyCheckInContent(e.target.value)}
                                rows={4}
                                maxLength={2000}
                                disabled={isDailySubmitting}
                            />
                            <Button onClick={() => handleSubmitCheckIn('daily')} disabled={isDailySubmitting || !dailyCheckInContent.trim()}>
                                {isDailySubmitting ? 'Submitting...' : 'Post Daily Update'}
                            </Button>
                        </div>
                         <div className="border-t pt-4 mt-4">
                            <h3 className="font-semibold mb-2">Team's Daily Progress</h3>
                             {memberIds.length > 0 ? (
                                <Accordion type="multiple" className="w-full">
                                   {memberIds.map(id => (
                                       <UserCheckInsDisplay
                                          key={id} 
                                          memberId={id} 
                                          memberProfiles={memberProfiles} 
                                          allCheckins={allDailyCheckins}
                                          isLoading={isLoadingAllDaily}
                                          type="daily"
                                      />
                                   ))}
                                </Accordion>
                            ) : (
                                <p className="text-sm text-muted-foreground">No members in this group yet.</p>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="weekly" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold">What are your goals for this week?</h3>
                            <Textarea
                                placeholder="Post your weekly goals, reflections, and plans..."
                                value={weeklyCheckInContent}
                                onChange={(e) => setWeeklyCheckInContent(e.target.value)}
                                rows={4}
                                maxLength={2000}
                                disabled={isWeeklySubmitting}
                            />
                            <Button onClick={() => handleSubmitCheckIn('weekly')} disabled={isWeeklySubmitting || !weeklyCheckInContent.trim()}>
                                {isWeeklySubmitting ? 'Submitting...' : 'Post Weekly Goals'}
                            </Button>
                        </div>
                        <div className="border-t pt-4 mt-4">
                            <h3 className="font-semibold mb-2">Team's Weekly Goals</h3>
                             {memberIds.length > 0 ? (
                                <Accordion type="multiple" className="w-full">
                                   {memberIds.map(id => (
                                       <UserCheckInsDisplay
                                          key={id} 
                                          memberId={id} 
                                          memberProfiles={memberProfiles} 
                                          allCheckins={allWeeklyCheckins}
                                          isLoading={isLoadingAllWeekly}
                                          type="weekly"
                                      />
                                   ))}
                                </Accordion>
                            ) : (
                                <p className="text-sm text-muted-foreground">No members in this group yet.</p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
