
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
import { UserProfile, TutorRole, TutorStatus, TutorRequest } from "@/lib/types";
import { doc, DocumentReference, updateDoc, writeBatch, serverTimestamp, collection, addDoc, query, where, Timestamp, documentId, arrayUnion } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { topics } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useDebounce } from "@/lib/hooks/useDebounce";

function TutorshipSetupForm({ user, userProfile }: { user: any, userProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isOffering, setIsOffering] = useState(userProfile.tutorRole === 'tutor' || userProfile.tutorRole === 'both');
    const [isSeeking, setIsSeeking] = useState(userProfile.tutorRole === 'student' || userProfile.tutorRole === 'both');
    const [status, setStatus] = useState<TutorStatus>(userProfile.tutorStatus || 'closed');
    const [tutoringSkills, setTutoringSkills] = useState<string[]>(userProfile.tutoringSkills || []);
    const [seekingSkills, setSeekingSkills] = useState<string[]>(userProfile.seekingTutoringSkills || []);
    const [currentTutoringSkill, setCurrentTutoringSkill] = useState('');
    const [currentSeekingSkill, setCurrentSeekingSkill] = useState('');

    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
    }, [user, firestore]);

    const handleUpdate = async () => {
        if (!userDocRef) return;
        setIsSubmitting(true);

        let newRole: TutorRole = 'none';
        if (isOffering && isSeeking) {
            newRole = 'both';
        } else if (isOffering) {
            newRole = 'tutor';
        } else if (isSeeking) {
            newRole = 'student';
        }
        
        const existingSkills = userProfile.skills || [];
        const combinedSkills = Array.from(new Set([...existingSkills, ...tutoringSkills, ...seekingSkills]));

        const updateData = {
            tutorRole: newRole,
            tutorStatus: status,
            tutoringSkills: isOffering ? tutoringSkills : [],
            seekingTutoringSkills: isSeeking ? seekingSkills : [],
            skills: combinedSkills,
        };

        try {
            await updateDoc(userDocRef, updateData);
            toast({ title: "Success", description: "Your tutoring profile has been updated." });
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
    
    const handleAddSkill = (type: 'tutoring' | 'seeking') => {
        if (type === 'tutoring' && currentTutoringSkill && !tutoringSkills.includes(currentTutoringSkill)) {
            setTutoringSkills([...tutoringSkills, currentTutoringSkill]);
            setCurrentTutoringSkill('');
        }
        if (type === 'seeking' && currentSeekingSkill && !seekingSkills.includes(currentSeekingSkill)) {
            setSeekingSkills([...seekingSkills, currentSeekingSkill]);
            setCurrentSeekingSkill('');
        }
    };
    
    const handleRemoveSkill = (type: 'tutoring' | 'seeking', skill: string) => {
        if (type === 'tutoring') {
            setTutoringSkills(tutoringSkills.filter(s => s !== skill));
        }
        if (type === 'seeking') {
            setSeekingSkills(seekingSkills.filter(s => s !== skill));
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Tutoring Profile</CardTitle>
                <CardDescription>Set up your profile to start connecting with others.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="offering-switch" className="text-base">Offer Tutoring</Label>
                            <p className="text-sm text-muted-foreground">Make yourself available as a tutor for others.</p>
                        </div>
                        <Switch id="offering-switch" checked={isOffering} onCheckedChange={setIsOffering} />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="seeking-switch" className="text-base">Seek Tutoring</Label>
                            <p className="text-sm text-muted-foreground">Indicate that you are looking for a tutor.</p>
                        </div>
                        <Switch id="seeking-switch" checked={isSeeking} onCheckedChange={setIsSeeking} />
                    </div>
                </div>
                
                 {(isOffering || isSeeking) && (
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="status-switch" className="text-base">Accepting New Requests</Label>
                            <p className="text-sm text-muted-foreground">Allow others to send you tutoring requests.</p>
                        </div>
                        <Switch id="status-switch" checked={status === 'open'} onCheckedChange={(checked) => setStatus(checked ? 'open' : 'closed')} />
                    </div>
                )}
                
                { isOffering && (
                    <div className="space-y-2">
                        <Label>Skills You Can Tutor In</Label>
                        <div className="flex flex-wrap gap-2">
                            {tutoringSkills.map(skill => (
                                <Badge key={skill} variant="secondary" className="flex items-center gap-1">{skill}
                                    <button onClick={() => handleRemoveSkill('tutoring', skill)}><X className="h-3 w-3"/></button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input value={currentTutoringSkill} onChange={e => setCurrentTutoringSkill(e.target.value)} placeholder="e.g., React" onKeyDown={e => e.key === 'Enter' && handleAddSkill('tutoring')}/>
                            <Button type="button" variant="outline" onClick={() => handleAddSkill('tutoring')}>Add</Button>
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

function TutorshipDashboard({ user, userProfile }: { user: any, userProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const incomingRequestsQuery = useMemo(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'tutorRequests'),
            where('toUid', '==', user.uid),
            where('status', '==', 'pending')
        );
    }, [firestore, user]);

    const { data: incomingRequests, isLoading: isLoadingRequests } = useCollection<TutorRequest>(incomingRequestsQuery);

    const handleRequest = async (request: TutorRequest, newStatus: 'accepted' | 'declined') => {
        const requestRef = doc(firestore, 'tutorRequests', request.id);
        const batch = writeBatch(firestore);

        batch.update(requestRef, { status: newStatus });
        let batchUpdateData = {};

        if (newStatus === 'accepted') {
            const requesterRef = doc(firestore, 'users', request.fromUid);
            const currentUserRef = doc(firestore, 'users', user.uid);

            const sortedUserIds = [request.fromUid, user.uid].sort();
            const tutorshipId = sortedUserIds.join('_');
            const tutorshipRef = doc(firestore, 'tutorships', tutorshipId);

            let tutorId, studentId;
            let requesterUpdate: { [key: string]: any } = { tutorshipIds: arrayUnion(tutorshipId) };
            let currentUserUpdate: { [key: string]: any } = { tutorshipIds: arrayUnion(tutorshipId) };

            if (request.type === 'seeking_tutor') { // Requester wants ME to be their tutor
                tutorId = user.uid;
                studentId = request.fromUid;
                requesterUpdate['tutorIds'] = arrayUnion(user.uid);
                currentUserUpdate['studentIds'] = arrayUnion(request.fromUid);
            } else { // Requester wants to be MY tutor
                tutorId = request.fromUid;
                studentId = user.uid;
                requesterUpdate['studentIds'] = arrayUnion(user.uid);
                currentUserUpdate['tutorIds'] = arrayUnion(request.fromUid);
            }
            
            batch.update(requesterRef, requesterUpdate);
            batch.update(currentUserRef, currentUserUpdate);

            batch.set(tutorshipRef, {
                id: tutorshipId,
                memberIds: sortedUserIds,
                tutorId: tutorId,
                studentId: studentId,
                createdAt: serverTimestamp()
            });
            batchUpdateData = { requesterUpdate, currentUserUpdate };
        }
        
        try {
            await batch.commit();
            toast({ title: `Request ${newStatus}` });
        } catch (serverError) {
            const permissionError = new FirestorePermissionError({
                path: `batch write for tutorship request ${request.id}`,
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
    
    const { data: tutors } = useCollection<UserProfile>(
        userProfile.tutorIds && userProfile.tutorIds.length > 0 
        ? query(collection(firestore, 'users'), where(documentId(), 'in', userProfile.tutorIds.slice(0, 10))) 
        : null
    );

    const { data: students } = useCollection<UserProfile>(
        userProfile.studentIds && userProfile.studentIds.length > 0
        ? query(collection(firestore, 'users'), where(documentId(), 'in', userProfile.studentIds.slice(0, 10)))
        : null
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><GraduationCap />Tutorship Dashboard</CardTitle>
                <CardDescription>Manage your tutoring connections and requests.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Incoming Requests</h3>
                    {isLoadingRequests && <p>Loading requests...</p>}
                    {!isLoadingRequests && (!incomingRequests || incomingRequests.length === 0) && <p className="text-sm text-muted-foreground">No new requests.</p>}
                    <div className="space-y-2">
                        {incomingRequests?.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-2 border rounded-md">
                                <p className="text-sm">{req.fromUsername} wants to be your {req.type === 'seeking_tutor' ? 'student' : 'tutor'}.</p>
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
                        <h3 className="font-semibold mb-2">Your Tutors</h3>
                        {tutors && tutors.length > 0 ? (
                           <ul className="divide-y">
                                {tutors.map(m => {
                                    const tutorshipId = [user.uid, m.id].sort().join('_');
                                    return (
                                        <li key={m.id} className="py-2">
                                            <Link href={`/tutorships/${tutorshipId}`} className="font-medium hover:underline">{m.username}</Link>
                                        </li>
                                    )
                                })}
                           </ul>
                        ) : <p className="text-sm text-muted-foreground">You have no tutors yet.</p>}
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">Your Students</h3>
                         {students && students.length > 0 ? (
                           <ul className="divide-y">
                                {students.map(m => {
                                    const tutorshipId = [user.uid, m.id].sort().join('_');
                                    return (
                                        <li key={m.id} className="py-2">
                                            <Link href={`/tutorships/${tutorshipId}`} className="font-medium hover:underline">{m.username}</Link>
                                        </li>
                                    )
                                })}
                           </ul>
                        ) : <p className="text-sm text-muted-foreground">You have no students yet.</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function TutorshipFinder({ currentUserProfile }: { currentUserProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [skillFilter, setSkillFilter] = useState('');
    const [nameSearch, setNameSearch] = useState('');
    const debouncedNameSearch = useDebounce(nameSearch, 300);

    const tutorsQuery = useMemo(() => {
        const baseQuery = query(
            collection(firestore, 'users'),
            where('tutorStatus', '==', 'open'),
            where('tutorRole', 'in', ['tutor', 'both'])
        );
        if (skillFilter) {
            return query(baseQuery, where('tutoringSkills', 'array-contains', skillFilter));
        }
        return baseQuery;
    }, [firestore, skillFilter]);

    const studentsQuery = useMemo(() => {
        const baseQuery = query(
            collection(firestore, 'users'),
            where('tutorStatus', '==', 'open'),
            where('tutorRole', 'in', ['student', 'both'])
        );
         if (skillFilter) {
            return query(baseQuery, where('seekingTutoringSkills', 'array-contains', skillFilter));
        }
        return baseQuery;
    }, [firestore, skillFilter]);
    
    const { data: allTutors, isLoading: tutorsLoading } = useCollection<UserProfile>(tutorsQuery);
    const { data: allStudents, isLoading: studentsLoading } = useCollection<UserProfile>(studentsQuery);

    const tutors = useMemo(() => {
        if (!allTutors) return null;
        if (!debouncedNameSearch) return allTutors;
        const searchLower = debouncedNameSearch.toLowerCase();
        return allTutors.filter(m => m.username_lowercase?.includes(searchLower));
    }, [allTutors, debouncedNameSearch]);

    const students = useMemo(() => {
        if (!allStudents) return null;
        if (!debouncedNameSearch) return allStudents;
        const searchLower = debouncedNameSearch.toLowerCase();
        return allStudents.filter(m => m.username_lowercase?.includes(searchLower));
    }, [allStudents, debouncedNameSearch]);

    const requestsSentQuery = useMemo(() => {
        if (!currentUserProfile.id) return null;
        return query(
            collection(firestore, 'tutorRequests'),
            where('fromUid', '==', currentUserProfile.id)
        );
    }, [firestore, currentUserProfile.id]);
    
    const { data: sentRequests, isLoading: sentLoading } = useCollection<TutorRequest>(requestsSentQuery);
    
    const receivedRequestsQuery = useMemo(() => {
        if (!currentUserProfile.id) return null;
        return query(
            collection(firestore, 'tutorRequests'),
            where('toUid', '==', currentUserProfile.id)
        );
    }, [firestore, currentUserProfile.id]);
    
    const { data: receivedRequests, isLoading: receivedLoading } = useCollection<TutorRequest>(receivedRequestsQuery);

    const allRequests = useMemo(() => {
        const combined = new Map<string, TutorRequest>();
        (sentRequests || []).forEach(req => combined.set(req.id, req));
        (receivedRequests || []).forEach(req => combined.set(req.id, req));
        return Array.from(combined.values());
    }, [sentRequests, receivedRequests]);


    const handleRequest = async (targetUser: UserProfile, type: 'seeking_tutor' | 'seeking_student') => {
        const requestsCollection = collection(firestore, 'tutorRequests');
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
            toast({ title: "Request Sent!", description: `Your tutoring request has been sent to ${targetUser.username}.`})
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
    
    const UserList = ({ users, listType, allRequests }: { users: UserProfile[] | null, listType: 'tutor' | 'student', allRequests: TutorRequest[] }) => {
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

                    const tutorshipId = [currentUserProfile.id, user.id].sort().join('_');
                    const isConnected = currentUserProfile.tutorshipIds?.includes(tutorshipId);

                    let button;
                    if (isConnected) {
                        button = (
                            <Button asChild className="w-full" variant="secondary">
                                <Link href={`/tutorships/${tutorshipId}`}>Dashboard</Link>
                            </Button>
                        );
                    } else if (relevantRequest) {
                        switch(relevantRequest.status) {
                            case 'pending':
                                button = <Button className="w-full" disabled>Pending</Button>;
                                break;
                            case 'accepted':
                                button = <Button className="w-full" disabled variant="secondary">Connected</Button>;
                                break;
                            case 'declined':
                                button = <Button className="w-full" disabled variant="outline">Declined</Button>;
                                break;
                            default:
                                button = <Button className="w-full" onClick={() => handleRequest(user, listType === 'tutor' ? 'seeking_tutor' : 'seeking_student' )}>Request</Button>;
                        }
                    } else {
                         const requestType = listType === 'tutor' ? 'seeking_tutor' : 'seeking_student';
                         button = <Button className="w-full" onClick={() => handleRequest(user, requestType)}>Request</Button>;
                    }

                    return (
                        <Card key={user.id}>
                            <CardHeader className="flex-row items-center gap-4">
                                <Link href={`/users/${user.id}`}><Avatar><AvatarImage src={user.profilePictureUrl} /><AvatarFallback>{user.username.charAt(0)}</AvatarFallback></Avatar></Link>
                                <div>
                                    <Link href={`/users/${user.id}`}><CardTitle className="text-base line-clamp-1">{user.username}</CardTitle></Link>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {(listType === 'tutor' ? user.tutoringSkills : user.seekingTutoringSkills)?.slice(0, 3).map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
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

    const isLoading = tutorsLoading || studentsLoading || sentLoading || receivedLoading;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Find a Connection</CardTitle>
                <CardDescription>Browse and filter to find the right person to connect with.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name..."
                            className="pl-10"
                            value={nameSearch}
                            onChange={e => setNameSearch(e.target.value)}
                        />
                    </div>
                    <Select value={skillFilter} onValueChange={(value) => setSkillFilter(value === 'all-skills' ? '' : value)}>
                        <SelectTrigger><SelectValue placeholder="Filter by skill..." /></SelectTrigger>
                        <SelectContent className="max-h-96 overflow-y-auto">
                            <SelectItem value="all-skills">All Skills</SelectItem>
                            {topics.map(topic => (
                                <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
                 <Tabs defaultValue="tutors">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="tutors">Find a Tutor</TabsTrigger>
                        <TabsTrigger value="students">Find a Student</TabsTrigger>
                    </TabsList>
                    <TabsContent value="tutors" className="pt-4">
                        {isLoading ? <p>Loading tutors...</p> : <UserList users={tutors} listType="tutor" allRequests={allRequests} />}
                    </TabsContent>
                    <TabsContent value="students" className="pt-4">
                        {isLoading ? <p>Loading students...</p> : <UserList users={students} listType="student" allRequests={allRequests}/>}
                    </TabsContent>
                 </Tabs>
            </CardContent>
        </Card>
    )
}

export default function TutorPage() {
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
            router.push('/login?redirect=/tutor');
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
                <h1 className="text-3xl font-headline mt-4">Tutoring Program</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Connect with experienced tutors or help students. Share knowledge, grow your skills, and build lasting professional relationships.
                </p>
            </div>
            <TutorshipSetupForm user={user} userProfile={userProfile} />
            <TutorshipDashboard user={user} userProfile={userProfile} />
            <TutorshipFinder currentUserProfile={userProfile} />
        </div>
    );
}
