'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { CheckIn, UserProfile } from '@/lib/types';
import { collection, query, orderBy, addDoc, serverTimestamp, where, getDocs, documentId, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from './ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTimestamp } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

interface CheckInSystemProps {
  groupOrCohortId: string;
  collectionPath: 'studyGroups' | 'groupProjects';
  memberIds: string[];
}

function UserWeeklyCheckIns({ memberId, memberProfiles, allWeeklyCheckins, isLoading }: { memberId: string, memberProfiles: Map<string, UserProfile>, allWeeklyCheckins: CheckIn[] | null, isLoading: boolean }) {
    const member = memberProfiles.get(memberId);
    
    const userWeeklyCheckins = useMemo(() => {
        return allWeeklyCheckins?.filter(c => c.userId === memberId) || [];
    }, [allWeeklyCheckins, memberId]);


    if (isLoading) {
        return <div>Loading check-ins...</div>;
    }

    return (
        <AccordionItem value={memberId}>
            <AccordionTrigger>
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={member?.profilePictureUrl} />
                        <AvatarFallback>{member?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{member?.username}</span>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                {userWeeklyCheckins.length > 0 ? (
                    <div className="space-y-3 pl-4 border-l-2 ml-4">
                        {userWeeklyCheckins.map(checkin => (
                            <div key={checkin.id} className="text-sm">
                                <p className="font-semibold">{formatTimestamp(checkin.createdAt, true)}</p>
                                <p className="text-muted-foreground whitespace-pre-wrap">{checkin.content}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground pl-10">No weekly goals from this user yet.</p>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}

function DailyProgressStream({ checkIns, memberProfiles, isLoading }: { checkIns: CheckIn[] | null, memberProfiles: Map<string, UserProfile>, isLoading: boolean }) {
    if (isLoading) {
        return <p className="text-sm text-muted-foreground">Loading daily progress...</p>
    }
    if (!checkIns || checkIns.length === 0) {
        return <p className="text-sm text-muted-foreground">No daily progress from the team yet.</p>
    }

    return (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {checkIns.map(checkin => {
                const member = memberProfiles.get(checkin.userId);
                return (
                    <div key={checkin.id} className="flex gap-3">
                         <Link href={`/users/${checkin.userId}`}>
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={member?.profilePictureUrl} />
                                <AvatarFallback>{member?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className="flex-1 text-sm">
                            <div className="flex items-baseline gap-2">
                                <span className="font-semibold">{member?.username || 'Unknown User'}</span>
                                <span className="text-xs text-muted-foreground">{formatTimestamp(checkin.createdAt, true)}</span>
                            </div>
                            <p className="text-muted-foreground whitespace-pre-wrap">{checkin.content}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
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
    
    // Fetch ALL checkins for the group, then filter client-side. This avoids invalid queries.
    const allDailyCheckinsQuery = useMemo(() => {
        return query(
            checkInsCollectionRef,
            where('type', '==', 'daily'),
            orderBy('createdAt', 'desc')
        );
    }, [checkInsCollectionRef]);

    const allWeeklyCheckinsQuery = useMemo(() => {
        return query(
            checkInsCollectionRef,
            where('type', '==', 'weekly'),
            orderBy('createdAt', 'desc')
        );
    }, [checkInsCollectionRef]);

    const { data: allDailyCheckins, isLoading: isLoadingAllDaily } = useCollection<CheckIn>(allDailyCheckinsQuery);
    const { data: allWeeklyCheckins, isLoading: isLoadingAllWeekly } = useCollection<CheckIn>(allWeeklyCheckinsQuery);

    // Client-side filtering
    const dailyCheckins = useMemo(() => {
        if (!allDailyCheckins) return null;
        if (memberIds.length === 0) return [];
        const memberIdSet = new Set(memberIds);
        return allDailyCheckins.filter(c => memberIdSet.has(c.userId));
    }, [allDailyCheckins, memberIds]);
    
    const weeklyCheckins = useMemo(() => {
        if (!allWeeklyCheckins) return null;
        if (memberIds.length === 0) return [];
        const memberIdSet = new Set(memberIds);
        return allWeeklyCheckins.filter(c => memberIdSet.has(c.userId));
    }, [allWeeklyCheckins, memberIds]);
    
    
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


    const handleSubmitCheckIn = (type: 'daily' | 'weekly') => {
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
        
        addDoc(checkInsCollectionRef, checkInData)
            .then(() => {
                toast({ title: "Check-in submitted!", description: "Your update has been posted." });
                if (type === 'daily') setDailyCheckInContent('');
                else setWeeklyCheckInContent('');
            })
            .catch(async (serverError) => {
                 const permissionError = new FirestorePermissionError({
                    path: checkInsCollectionRef.path,
                    operation: 'create',
                    requestResourceData: checkInData,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                 if (type === 'daily') setIsDailySubmitting(false);
                 else setIsWeeklySubmitting(false);
            });
    };
    
    if (!isMember) {
        return null;
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
                            <DailyProgressStream 
                                checkIns={dailyCheckins}
                                memberProfiles={memberProfiles}
                                isLoading={isLoadingAllDaily}
                            />
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
                                       <UserWeeklyCheckIns 
                                          key={id} 
                                          memberId={id} 
                                          memberProfiles={memberProfiles} 
                                          allWeeklyCheckins={weeklyCheckins}
                                          isLoading={isLoadingAllWeekly}
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
