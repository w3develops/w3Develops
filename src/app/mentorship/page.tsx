'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, BrainCircuit, Search, GraduationCap } from "lucide-react";
import { UserProfile, MentorshipRole, MentorshipStatus, MentorshipRequest } from "@/lib/types";
import { doc, DocumentReference, updateDoc, writeBatch, serverTimestamp, collection, addDoc, query, where, Timestamp, documentId, arrayUnion } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { topics } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

function MentorshipSetupForm({ user, userProfile }: { user: any, userProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isOffering, setIsOffering] = useState(userProfile.mentorshipRole === 'mentor' || userProfile.mentorshipRole === 'both');
    const [isSeeking, setIsSeeking] = useState(userProfile.mentorshipRole === 'mentee' || userProfile.mentorshipRole === 'both');
    const [status, setStatus] = useState<MentorshipStatus>(userProfile.mentorshipStatus || 'closed');
    const [mentoringSkills, setMentoringSkills] = useState<string[]>(userProfile.mentoringSkills || []);
    const [seekingSkills, setSeekingSkills] = useState<string[]>(userProfile.seekingSkills || []);
    const [currentMentoringSkill, setCurrentMentoringSkill] = useState('');
    const [currentSeekingSkill, setCurrentSeekingSkill] = useState('');

    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
    }, [user, firestore]);

    const handleUpdate = async () => {
        if (!userDocRef) return;
        setIsSubmitting(true);

        let newRole: MentorshipRole = 'none';
        if (isOffering && isSeeking) {
            newRole = 'both';
        } else if (isOffering) {
            newRole = 'mentor';
        } else if (isSeeking) {
            newRole = 'mentee';
        }
        
        const existingSkills = userProfile.skills || [];
        const combinedSkills = [...new Set([...existingSkills, ...mentoringSkills, ...seekingSkills])];

        const updateData = {
            mentorshipRole: newRole,
            mentorshipStatus: status,
            mentoringSkills: isOffering ? mentoringSkills : [],
            seekingSkills: isSeeking ? seekingSkills : [],
            skills: combinedSkills,
        };

        try {
            await updateDoc(userDocRef, updateData);
            toast({ title: "Success", description: "Your mentorship profile has been updated." });
        } catch (error: any) {
             const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: updateData,
              } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: "Error", description: "Could not update profile due to permissions." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleAddSkill = (type: 'mentoring' | 'seeking') => {
        if (type === 'mentoring' && currentMentoringSkill && !mentoringSkills.includes(currentMentoringSkill)) {
            setMentoringSkills([...mentoringSkills, currentMentoringSkill]);
            setCurrentMentoringSkill('');
        }
        if (type === 'seeking' && currentSeekingSkill && !seekingSkills.includes(currentSeekingSkill)) {
            setSeekingSkills([...seekingSkills, currentSeekingSkill]);
            setCurrentSeekingSkill('');
        }
    };
    
    const handleRemoveSkill = (type: 'mentoring' | 'seeking', skill: string) => {
        if (type === 'mentoring') {
            setMentoringSkills(mentoringSkills.filter(s => s !== skill));
        }
        if (type === 'seeking') {
            setSeekingSkills(seekingSkills.filter(s => s !== skill));
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Mentorship Profile</CardTitle>
                <CardDescription>Set up your profile to start connecting with others.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="offering-switch" className="text-base">Offer Mentorship</Label>
                            <p className="text-sm text-muted-foreground">Make yourself available as a mentor for others.</p>
                        </div>
                        <Switch id="offering-switch" checked={isOffering} onCheckedChange={setIsOffering} />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="seeking-switch" className="text-base">Seek Mentorship</Label>
                            <p className="text-sm text-muted-foreground">Indicate that you are looking for a mentor.</p>
                        </div>
                        <Switch id="seeking-switch" checked={isSeeking} onCheckedChange={setIsSeeking} />
                    </div>
                </div>
                
                 {(isOffering || isSeeking) && (
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="status-switch" className="text-base">Accepting New Requests</Label>
                            <p className="text-sm text-muted-foreground">Allow others to send you mentorship requests.</p>
                        </div>
                        <Switch id="status-switch" checked={status === 'open'} onCheckedChange={(checked) => setStatus(checked ? 'open' : 'closed')} />
                    </div>
                )}
                
                { isOffering && (
                    <div className="space-y-2">
                        <Label>Skills You Can Mentor In</Label>
                        <div className="flex flex-wrap gap-2">
                            {mentoringSkills.map(skill => (
                                <Badge key={skill} variant="secondary" className="flex items-center gap-1">{skill}
                                    <button onClick={() => handleRemoveSkill('mentoring', skill)}><X className="h-3 w-3"/></button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input value={currentMentoringSkill} onChange={e => setCurrentMentoringSkill(e.target.value)} placeholder="e.g., React" onKeyDown={e => e.key === 'Enter' && handleAddSkill('mentoring')}/>
                            <Button type="button" variant="outline" onClick={() => handleAddSkill('mentoring')}>Add</Button>
                        </div>
                    </div>
                )}
                
                { isSeeking && (
                    <div className="space-y-2">
                        <Label>Skills You Want to Learn</Label>
                        <div className="flex flex-wrap gap-2">
                            {seekingSkills.map(skill => (
                                <Badge key={skill} variant="secondary" className="flex items-center gap-1">{skill}
                                    <button onClick={() => handleRemoveSkill('seeking', skill)}><X className="h-3 w-3"/></button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input value={currentSeekingSkill} onChange={e => setCurrentSeekingSkill(e.target.value)} placeholder="e.g., Python" onKeyDown={e => e.key === 'Enter' && handleAddSkill('seeking')}/>
                            <Button type="button" variant="outline" onClick={() => handleAddSkill('seeking')}>Add</Button>
                        </div>
                    </div>
                )}
                
                <Button onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Profile'}</Button>
            </CardContent>
        </Card>
    )
}

function MentorshipDashboard({ user, userProfile }: { user: any, userProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const incomingRequestsQuery = useMemo(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'mentorshipRequests'),
            where('toUid', '==', user.uid),
            where('status', '==', 'pending')
        );
    }, [firestore, user]);

    const { data: incomingRequests, isLoading: isLoadingRequests } = useCollection<MentorshipRequest>(incomingRequestsQuery);

    const handleRequest = async (request: MentorshipRequest, newStatus: 'accepted' | 'declined') => {
        const requestRef = doc(firestore, 'mentorshipRequests', request.id);
        const batch = writeBatch(firestore);

        batch.update(requestRef, { status: newStatus });
        let batchUpdateData = {};

        if (newStatus === 'accepted') {
            const requesterRef = doc(firestore, 'users', request.fromUid);
            const currentUserRef = doc(firestore, 'users', user.uid);

            const sortedUserIds = [request.fromUid, user.uid].sort();
            const mentorshipId = sortedUserIds.join('_');
            const mentorshipRef = doc(firestore, 'mentorships', mentorshipId);

            let mentorId, menteeId;
            let requesterUpdate: { [key: string]: any } = { mentorshipIds: arrayUnion(mentorshipId) };
            let currentUserUpdate: { [key: string]: any } = { mentorshipIds: arrayUnion(mentorshipId) };

            if (request.type === 'seeking_mentor') { // Requester wants ME to be their mentor
                mentorId = user.uid;
                menteeId = request.fromUid;
                requesterUpdate['mentorIds'] = arrayUnion(user.uid);
                currentUserUpdate['menteeIds'] = arrayUnion(request.fromUid);
            } else { // Requester wants to be MY mentor
                mentorId = request.fromUid;
                menteeId = user.uid;
                requesterUpdate['menteeIds'] = arrayUnion(user.uid);
                currentUserUpdate['mentorIds'] = arrayUnion(request.fromUid);
            }
            
            batch.update(requesterRef, requesterUpdate);
            batch.update(currentUserRef, currentUserUpdate);

            batch.set(mentorshipRef, {
                id: mentorshipId,
                memberIds: sortedUserIds,
                mentorId: mentorId,
                menteeId: menteeId,
                createdAt: serverTimestamp()
            });
            batchUpdateData = { requesterUpdate, currentUserUpdate };
        }
        
        try {
            await batch.commit();
            toast({ title: `Request ${newStatus}` });
        } catch (serverError) {
            console.error("Error handling mentorship request:", serverError);
            const permissionError = new FirestorePermissionError({
                path: `batch write for mentorship request ${request.id}`,
                operation: 'update',
                requestResourceData: batchUpdateData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Failed to process request due to a permission issue. Please try again.",
                duration: 10000
            });
        }
    };
    
    const { data: mentors } = useCollection<UserProfile>(
        userProfile.mentorIds && userProfile.mentorIds.length > 0 
        ? query(collection(firestore, 'users'), where(documentId(), 'in', userProfile.mentorIds.slice(0, 10))) 
        : null
    );

    const { data: mentees } = useCollection<UserProfile>(
        userProfile.menteeIds && userProfile.menteeIds.length > 0
        ? query(collection(firestore, 'users'), where(documentId(), 'in', userProfile.menteeIds.slice(0, 10)))
        : null
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><GraduationCap />Mentorship Dashboard</CardTitle>
                <CardDescription>Manage your mentorship connections and requests.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Incoming Requests</h3>
                    {isLoadingRequests && <p>Loading requests...</p>}
                    {!isLoadingRequests && (!incomingRequests || incomingRequests.length === 0) && <p className="text-sm text-muted-foreground">No new requests.</p>}
                    <div className="space-y-2">
                        {incomingRequests?.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-2 border rounded-md">
                                <p className="text-sm">{req.fromUsername} wants to be your {req.type === 'seeking_mentor' ? 'mentee' : 'mentor'}.</p>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleRequest(req, 'accepted')}>Accept</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleRequest(req, 'declined')}>Decline</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold mb-2">Your Mentors</h3>
                        {mentors && mentors.length > 0 ? (
                           <ul className="divide-y">
                                {mentors.map(m => {
                                    const mentorshipId = [user.uid, m.id].sort().join('_');
                                    return (
                                        <li key={m.id} className="py-2">
                                            <Link href={`/mentorships/${mentorshipId}`} className="font-medium hover:underline">{m.username}</Link>
                                        </li>
                                    )
                                })}
                           </ul>
                        ) : <p className="text-sm text-muted-foreground">You have no mentors yet.</p>}
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">Your Mentees</h3>
                         {mentees && mentees.length > 0 ? (
                           <ul className="divide-y">
                                {mentees.map(m => {
                                    const mentorshipId = [user.uid, m.id].sort().join('_');
                                    return (
                                        <li key={m.id} className="py-2">
                                            <Link href={`/mentorships/${mentorshipId}`} className="font-medium hover:underline">{m.username}</Link>
                                        </li>
                                    )
                                })}
                           </ul>
                        ) : <p className="text-sm text-muted-foreground">You have no mentees yet.</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function MentorshipFinder({ currentUserProfile }: { currentUserProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [skillFilter, setSkillFilter] = useState('');

    const mentorsQuery = useMemo(() => {
        const baseQuery = query(
            collection(firestore, 'users'),
            where('mentorshipStatus', '==', 'open'),
            where('mentorshipRole', 'in', ['mentor', 'both'])
        );
        if (skillFilter) {
            return query(baseQuery, where('mentoringSkills', 'array-contains', skillFilter));
        }
        return baseQuery;
    }, [firestore, skillFilter]);

    const menteesQuery = useMemo(() => {
        const baseQuery = query(
            collection(firestore, 'users'),
            where('mentorshipStatus', '==', 'open'),
            where('mentorshipRole', 'in', ['mentee', 'both'])
        );
         if (skillFilter) {
            return query(baseQuery, where('seekingSkills', 'array-contains', skillFilter));
        }
        return baseQuery;
    }, [firestore, skillFilter]);
    
    const { data: mentors, isLoading: mentorsLoading } = useCollection<UserProfile>(mentorsQuery);
    const { data: mentees, isLoading: menteesLoading } = useCollection<UserProfile>(menteesQuery);

    const requestsSentQuery = useMemo(() => {
        if (!currentUserProfile.id) return null;
        return query(
            collection(firestore, 'mentorshipRequests'),
            where('fromUid', '==', currentUserProfile.id)
        );
    }, [firestore, currentUserProfile.id]);
    
    const { data: sentRequests, isLoading: sentLoading } = useCollection<MentorshipRequest>(requestsSentQuery);
    
    const receivedRequestsQuery = useMemo(() => {
        if (!currentUserProfile.id) return null;
        return query(
            collection(firestore, 'mentorshipRequests'),
            where('toUid', '==', currentUserProfile.id)
        );
    }, [firestore, currentUserProfile.id]);
    
    const { data: receivedRequests, isLoading: receivedLoading } = useCollection<MentorshipRequest>(receivedRequestsQuery);

    const allRequests = useMemo(() => {
        const combined = new Map<string, MentorshipRequest>();
        (sentRequests || []).forEach(req => combined.set(req.id, req));
        (receivedRequests || []).forEach(req => combined.set(req.id, req));
        return Array.from(combined.values());
    }, [sentRequests, receivedRequests]);


    const handleRequest = async (targetUser: UserProfile, type: 'seeking_mentor' | 'seeking_mentee') => {
        const requestsCollection = collection(firestore, 'mentorshipRequests');
        const requestData = {
            fromUid: currentUserProfile.id,
            fromUsername: currentUserProfile.username,
            toUid: targetUser.id,
            toUsername: targetUser.username,
            type: type,
            status: 'pending' as const,
            createdAt: serverTimestamp()
        };

        try {
            await addDoc(requestsCollection, requestData);
            toast({ title: "Request Sent!", description: `Your mentorship request has been sent to ${targetUser.username}.`})
        } catch (serverError) {
            const permissionError = new FirestorePermissionError({
                path: requestsCollection.path,
                operation: 'create',
                requestResourceData: requestData,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: "Error Sending Request",
                description: "Could not send request. Please check your permissions and try again.",
            });
        }
    };
    
    const UserList = ({ users, listType, allRequests }: { users: UserProfile[] | null, listType: 'mentor' | 'mentee', allRequests: MentorshipRequest[] }) => {
        if (!users || users.length === 0) {
            return <p className="text-muted-foreground text-center py-8">No {listType}s found matching your criteria.</p>
        }

        return (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.filter(u => u.id !== currentUserProfile.id).map(user => {
                    const relevantRequest = allRequests.find(req => 
                        (req.fromUid === currentUserProfile.id && req.toUid === user.id) || 
                        (req.fromUid === user.id && req.toUid === currentUserProfile.id)
                    );

                    const mentorshipId = [currentUserProfile.id, user.id].sort().join('_');
                    const isConnected = currentUserProfile.mentorshipIds?.includes(mentorshipId);

                    let button;
                    if (isConnected) {
                        button = <Button className="w-full" disabled variant="secondary">Connected</Button>;
                    } else if (relevantRequest) {
                        switch(relevantRequest.status) {
                            case 'pending':
                                button = <Button className="w-full" disabled>Pending</Button>;
                                break;
                            case 'accepted':
                                button = <Button className="w-full" disabled variant="secondary">Accepted</Button>;
                                break;
                            case 'declined':
                                button = <Button className="w-full" disabled variant="outline">Declined</Button>;
                                break;
                            default:
                                button = <Button className="w-full" onClick={() => handleRequest(user, listType === 'mentor' ? 'seeking_mentor' : 'seeking_mentee' )}>Request</Button>;
                        }
                    } else {
                         const requestType = listType === 'mentor' ? 'seeking_mentor' : 'seeking_mentee';
                         button = <Button className="w-full" onClick={() => handleRequest(user, requestType)}>Request</Button>;
                    }

                    return (
                        <Card key={user.id}>
                            <CardHeader className="flex-row items-center gap-4">
                                <Link href={`/users/${user.id}`}><Avatar><AvatarImage src={user.profilePictureUrl} /><AvatarFallback>{user.username.charAt(0)}</AvatarFallback></Avatar></Link>
                                <div>
                                    <Link href={`/users/${user.id}`}><CardTitle className="text-base line-clamp-1">{user.username}</CardTitle></Link>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {(listType === 'mentor' ? user.mentoringSkills : user.seekingSkills)?.slice(0, 3).map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {button}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        )
    };

    const isLoading = mentorsLoading || menteesLoading || sentLoading || receivedLoading;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Find a Connection</CardTitle>
                <CardDescription>Browse and filter to find the right person to connect with.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Select value={skillFilter} onValueChange={(value) => setSkillFilter(value === 'all-skills' ? '' : value)}>
                        <SelectTrigger className="pl-10"><SelectValue placeholder="Filter by skill..." /></SelectTrigger>
                        <SelectContent className="max-h-96 overflow-y-auto">
                            <SelectItem value="all-skills">All Skills</SelectItem>
                            {topics.map(topic => (
                                <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
                 <Tabs defaultValue="mentors">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="mentors">Find a Mentor</TabsTrigger>
                        <TabsTrigger value="mentees">Find a Mentee</TabsTrigger>
                    </TabsList>
                    <TabsContent value="mentors" className="pt-4">
                        {isLoading ? <p>Loading mentors...</p> : <UserList users={mentors} listType="mentor" allRequests={allRequests} />}
                    </TabsContent>
                    <TabsContent value="mentees" className="pt-4">
                        {isLoading ? <p>Loading mentees...</p> : <UserList users={mentees} listType="mentee" allRequests={allRequests}/>}
                    </TabsContent>
                 </Tabs>
            </CardContent>
        </Card>
    )
}

export default function MentorshipPage() {
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
            router.push('/login?redirect=/mentorship');
        }
    }, [user, isUserLoading, router]);
    
    if (isUserLoading || isProfileLoading || !user || !userProfile) {
        return (
            <div className="p-4 md:p-10">
                <LoadingSkeleton />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8">
            <div className="text-center">
                <GraduationCap className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-3xl font-headline mt-4">Mentorship Program</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Connect with experienced developers or guide newcomers. Share knowledge, grow your skills, and build lasting professional relationships.
                </p>
            </div>
            <MentorshipSetupForm user={user} userProfile={userProfile} />
            <MentorshipDashboard user={user} userProfile={userProfile} />
            <MentorshipFinder currentUserProfile={userProfile} />
        </div>
    );
}
