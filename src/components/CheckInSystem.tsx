
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
  collectionPath: 'studyGroups' | 'cohorts';
  memberIds: string[];
}

function UserCheckIns({ memberId, memberProfiles, groupOrCohortId, collectionPath }: { memberId: string, memberProfiles: Map<string, UserProfile>, groupOrCohortId: string, collectionPath: string }) {
    const firestore = useFirestore();
    const member = memberProfiles.get(memberId);
    
    const weeklyCheckinsQuery = useMemo(() => {
        return query(
            collection(firestore, collectionPath, groupOrCohortId, 'checkIns'),
            where('userId', '==', memberId),
            where('type', '==', 'weekly'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, collectionPath, groupOrCohortId, memberId]);

    const { data: weeklyCheckins, isLoading: isLoadingWeekly } = useCollection<CheckIn>(weeklyCheckinsQuery);

    if (isLoadingWeekly) {
        return <div>Loading check-ins...</div>;
    }

    return (
        <AccordionItem value={memberId}>
            <AccordionTrigger>
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={member?.profilePictureUrl} />
                        <AvatarFallback>{member?.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{member?.username}</span>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                {weeklyCheckins && weeklyCheckins.length > 0 ? (
                    <div className="space-y-3 pl-4 border-l-2 ml-4">
                        {weeklyCheckins.map(checkin => (
                            <div key={checkin.id} className="text-sm">
                                <p className="font-semibold">{formatTimestamp(checkin.createdAt, true)}</p>
                                <p className="text-muted-foreground whitespace-pre-wrap">{checkin.content}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground pl-10">No weekly check-ins from this user yet.</p>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}


export default function CheckInSystem({ groupOrCohortId, collectionPath, memberIds }: CheckInSystemProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [checkInContent, setCheckInContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
    const [memberProfiles, setMemberProfiles] = useState<Map<string, UserProfile>>(new Map());

    const isMember = user ? memberIds.includes(user.uid) : false;

    const checkInsCollectionRef = useMemo(() => 
        collection(firestore, collectionPath, groupOrCohortId, 'checkIns'),
        [firestore, collectionPath, groupOrCohortId]
    );

    useEffect(() => {
        const fetchMemberProfiles = async () => {
            if (memberIds.length === 0 || memberProfiles.size === memberIds.length) return;
            
            const idsToFetch = memberIds.filter(id => !memberProfiles.has(id));
            if (idsToFetch.length === 0) return;
            
            try {
                const profilesQuery = query(collection(firestore, 'users'), where(documentId(), 'in', idsToFetch.slice(0, 30)));
                const snapshot = await getDocs(profilesQuery);
                const newProfiles = new Map(memberProfiles);
                snapshot.forEach(docSnap => {
                    newProfiles.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as UserProfile);
                });
                setMemberProfiles(newProfiles);
            } catch (error) {
                console.error("Error fetching member profiles:", error);
            }
        };
        fetchMemberProfiles();
    }, [memberIds, firestore, memberProfiles]);


    const handleSubmitCheckIn = () => {
        if (!user || !isMember || !checkInContent.trim()) return;

        setIsSubmitting(true);
        const checkInData = {
            userId: user.uid,
            type: activeTab,
            content: checkInContent,
            createdAt: serverTimestamp(),
        };
        
        addDoc(checkInsCollectionRef, checkInData)
            .then(() => {
                toast({ title: "Check-in submitted!", description: "Your update has been posted." });
                setCheckInContent('');
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
                setIsSubmitting(false);
            });
    };
    
    if (!isMember) {
        return null; // or a message for non-members
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Check-ins</CardTitle>
                <CardDescription>Post your progress and see what others are up to.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'daily' | 'weekly')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="daily">Daily Check-in</TabsTrigger>
                        <TabsTrigger value="weekly">Weekly Team Check-ins</TabsTrigger>
                    </TabsList>
                    <TabsContent value="daily" className="space-y-4 pt-4">
                        <h3 className="font-semibold">What did you work on today?</h3>
                         <Textarea
                            placeholder="Share your progress, challenges, and goals..."
                            value={checkInContent}
                            onChange={(e) => setCheckInContent(e.target.value)}
                            rows={4}
                            maxLength={2000}
                            disabled={isSubmitting}
                        />
                        <Button onClick={handleSubmitCheckIn} disabled={isSubmitting || !checkInContent.trim()}>
                            {isSubmitting ? 'Submitting...' : 'Post Daily Check-in'}
                        </Button>
                    </TabsContent>
                    <TabsContent value="weekly" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold">What are your goals for this week?</h3>
                            <Textarea
                                placeholder="Post your weekly goals, reflections, and plans..."
                                value={checkInContent}
                                onChange={(e) => setCheckInContent(e.target.value)}
                                rows={4}
                                maxLength={2000}
                                disabled={isSubmitting}
                            />
                            <Button onClick={handleSubmitCheckIn} disabled={isSubmitting || !checkInContent.trim()}>
                                {isSubmitting ? 'Submitting...' : 'Post Weekly Check-in'}
                            </Button>
                        </div>
                        <div className="border-t pt-4 mt-4">
                            <h3 className="font-semibold mb-2">Team's Weekly Check-ins</h3>
                             {memberIds.length > 0 ? (
                                <Accordion type="multiple" className="w-full">
                                   {memberIds.map(id => (
                                       <UserCheckIns key={id} memberId={id} memberProfiles={memberProfiles} groupOrCohortId={groupOrCohortId} collectionPath={collectionPath}/>
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

    