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
import { X, Search, GraduationCap } from "lucide-react";
import { UserProfile } from "@/lib/types";
import { doc, DocumentReference, updateDoc, writeBatch, serverTimestamp, collection, addDoc, query, where, documentId, arrayUnion } from "firebase/firestore";
import type { User } from "firebase/auth";
import { useToast } from "@/components/ui/use-toast";
import { topics } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useDebounce } from "@/lib/hooks/useDebounce";

type Role = { singular: string; plural: string; title: string };
type ProfileList = 'mentoringSkills' | 'seekingSkills' | 'mentorIds' | 'menteeIds' | 'mentorshipIds'
    | 'tutoringSkills' | 'seekingTutoringSkills' | 'tutorIds' | 'studentIds' | 'tutorshipIds';

// Mentorship and tutoring work the same way: people offer or seek help,
// send requests, and accepted requests become a shared space. Only the
// names of the collections, profile fields and words differ.
export interface MatchingConfig {
    program: string;            // "Mentorship", used in headings and messages
    dashboardTitle: string;
    intro: string;
    pageRoute: string;          // where this page lives, for the login redirect
    offerer: Role;              // e.g. mentor
    seeker: Role;               // e.g. mentee
    requestsCollection: string;
    connectionsCollection: string;
    connectionsRoute: string;
    fields: {
        role: 'mentorshipRole' | 'tutorRole';
        status: 'mentorshipStatus' | 'tutorStatus';
        offerSkills: ProfileList;
        seekSkills: ProfileList;
        offererIds: ProfileList;
        seekerIds: ProfileList;
        connectionIds: ProfileList;
    };
}

interface MatchingRequest {
    id: string;
    fromUid: string;
    fromUsername: string;
    toUid: string;
    toUsername: string;
    type: string;
    status: 'pending' | 'accepted' | 'declined';
}

type Status = 'open' | 'closed';

const listOf = (profile: UserProfile, field: ProfileList) => (profile[field] as string[] | undefined) || [];
const connectionIdFor = (a: string, b: string) => [a, b].sort().join('_');

function SetupForm({ config, user, userProfile }: { config: MatchingConfig; user: User; userProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { fields, offerer, seeker } = config;
    const role = userProfile[fields.role] as string | undefined;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isOffering, setIsOffering] = useState(role === offerer.singular || role === 'both');
    const [isSeeking, setIsSeeking] = useState(role === seeker.singular || role === 'both');
    const [status, setStatus] = useState<Status>((userProfile[fields.status] as Status | undefined) || 'closed');
    const [offerSkills, setOfferSkills] = useState<string[]>(listOf(userProfile, fields.offerSkills));
    const [seekSkills, setSeekSkills] = useState<string[]>(listOf(userProfile, fields.seekSkills));
    const [currentOfferSkill, setCurrentOfferSkill] = useState('');
    const [currentSeekSkill, setCurrentSeekSkill] = useState('');

    const userDocRef = useMemo(() => doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>, [user, firestore]);

    const handleUpdate = async () => {
        setIsSubmitting(true);

        let newRole = 'none';
        if (isOffering && isSeeking) {
            newRole = 'both';
        } else if (isOffering) {
            newRole = offerer.singular;
        } else if (isSeeking) {
            newRole = seeker.singular;
        }

        const updateData = {
            [fields.role]: newRole,
            [fields.status]: status,
            [fields.offerSkills]: isOffering ? offerSkills : [],
            [fields.seekSkills]: isSeeking ? seekSkills : [],
            skills: Array.from(new Set([...(userProfile.skills || []), ...offerSkills, ...seekSkills])),
        };

        try {
            await updateDoc(userDocRef, updateData);
            toast({ title: "Success", description: `Your ${config.program.toLowerCase()} profile has been updated.` });
        } catch {
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

    const skillEditor = (
        label: string,
        placeholder: string,
        skills: string[],
        setSkills: (skills: string[]) => void,
        current: string,
        setCurrent: (value: string) => void,
    ) => {
        const add = () => {
            if (current && !skills.includes(current)) {
                setSkills([...skills, current]);
                setCurrent('');
            }
        };
        return (
            <div className="space-y-2">
                <Label>{label}</Label>
                <div className="flex flex-wrap gap-2">
                    {skills.map(skill => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-1">{skill}
                            <button onClick={() => setSkills(skills.filter(s => s !== skill))}><X className="h-3 w-3"/></button>
                        </Badge>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Input value={current} onChange={e => setCurrent(e.target.value)} placeholder={placeholder} onKeyDown={e => e.key === 'Enter' && add()}/>
                    <Button type="button" variant="outline" onClick={add}>Add</Button>
                </div>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your {config.program} Profile</CardTitle>
                <CardDescription>Set up your profile to start connecting with others.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="offering-switch" className="text-base">Offer {config.program}</Label>
                            <p className="text-sm text-muted-foreground">Make yourself available as a {offerer.singular} for others.</p>
                        </div>
                        <Switch id="offering-switch" checked={isOffering} onCheckedChange={setIsOffering} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="seeking-switch" className="text-base">Seek {config.program}</Label>
                            <p className="text-sm text-muted-foreground">Indicate that you are looking for a {offerer.singular}.</p>
                        </div>
                        <Switch id="seeking-switch" checked={isSeeking} onCheckedChange={setIsSeeking} />
                    </div>
                </div>

                {(isOffering || isSeeking) && (
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="status-switch" className="text-base">Accepting New Requests</Label>
                            <p className="text-sm text-muted-foreground">Allow others to send you {config.program.toLowerCase()} requests.</p>
                        </div>
                        <Switch id="status-switch" checked={status === 'open'} onCheckedChange={(checked) => setStatus(checked ? 'open' : 'closed')} />
                    </div>
                )}

                {isOffering && skillEditor(`Skills You Can ${offerer.title} In`, 'e.g., React', offerSkills, setOfferSkills, currentOfferSkill, setCurrentOfferSkill)}
                {isSeeking && skillEditor('Skills You Want to Learn', 'e.g., Python', seekSkills, setSeekSkills, currentSeekSkill, setCurrentSeekSkill)}

                <Button onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Profile'}</Button>
            </CardContent>
        </Card>
    );
}

function Dashboard({ config, user, userProfile }: { config: MatchingConfig; user: User; userProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { fields, offerer, seeker } = config;

    const incomingRequestsQuery = useMemo(() => query(
        collection(firestore, config.requestsCollection),
        where('toUid', '==', user.uid),
        where('status', '==', 'pending')
    ), [firestore, user, config.requestsCollection]);

    const { data: incomingRequests, isLoading: isLoadingRequests } = useCollection<MatchingRequest>(incomingRequestsQuery);

    const handleRequest = async (request: MatchingRequest, newStatus: 'accepted' | 'declined') => {
        const batch = writeBatch(firestore);
        batch.update(doc(firestore, config.requestsCollection, request.id), { status: newStatus });
        let batchUpdateData = {};

        if (newStatus === 'accepted') {
            const connectionId = connectionIdFor(request.fromUid, user.uid);
            const requesterUpdate: Record<string, unknown> = { [fields.connectionIds]: arrayUnion(connectionId) };
            const currentUserUpdate: Record<string, unknown> = { [fields.connectionIds]: arrayUnion(connectionId) };

            // The requester asked me to be their offerer, or offered to be mine
            const iAmOfferer = request.type === `seeking_${offerer.singular}`;
            const offererId = iAmOfferer ? user.uid : request.fromUid;
            const seekerId = iAmOfferer ? request.fromUid : user.uid;
            if (iAmOfferer) {
                requesterUpdate[fields.offererIds] = arrayUnion(user.uid);
                currentUserUpdate[fields.seekerIds] = arrayUnion(request.fromUid);
            } else {
                requesterUpdate[fields.seekerIds] = arrayUnion(user.uid);
                currentUserUpdate[fields.offererIds] = arrayUnion(request.fromUid);
            }

            batch.update(doc(firestore, 'users', request.fromUid), requesterUpdate);
            batch.update(doc(firestore, 'users', user.uid), currentUserUpdate);
            batch.set(doc(firestore, config.connectionsCollection, connectionId), {
                id: connectionId,
                memberIds: [request.fromUid, user.uid].sort(),
                [`${offerer.singular}Id`]: offererId,
                [`${seeker.singular}Id`]: seekerId,
                createdAt: serverTimestamp()
            });
            batchUpdateData = { requesterUpdate, currentUserUpdate };
        }

        try {
            await batch.commit();
            toast({ title: `Request ${newStatus}` });
        } catch {
            const permissionError = new FirestorePermissionError({
                path: `batch write for ${config.program.toLowerCase()} request ${request.id}`,
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

    const offererIds = listOf(userProfile, fields.offererIds);
    const seekerIds = listOf(userProfile, fields.seekerIds);
    const { data: offerers } = useCollection<UserProfile>(
        offererIds.length > 0 ? query(collection(firestore, 'users'), where(documentId(), 'in', offererIds.slice(0, 10))) : null
    );
    const { data: seekers } = useCollection<UserProfile>(
        seekerIds.length > 0 ? query(collection(firestore, 'users'), where(documentId(), 'in', seekerIds.slice(0, 10))) : null
    );

    const connectionList = (people: UserProfile[] | null, role: Role) => (
        <div>
            <h3 className="font-semibold mb-2">Your {role.title}s</h3>
            {people && people.length > 0 ? (
                <ul className="divide-y">
                    {people.map(person => (
                        <li key={person.id} className="py-2">
                            <Link href={`${config.connectionsRoute}/${connectionIdFor(user.uid, person.id)}`} className="font-medium hover:underline">{person.username}</Link>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-sm text-muted-foreground">You have no {role.plural} yet.</p>}
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><GraduationCap />{config.dashboardTitle}</CardTitle>
                <CardDescription>Manage your {config.program.toLowerCase()} connections and requests.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Incoming Requests</h3>
                    {isLoadingRequests && <p>Loading requests...</p>}
                    {!isLoadingRequests && (!incomingRequests || incomingRequests.length === 0) && <p className="text-sm text-muted-foreground">No new requests.</p>}
                    <div className="space-y-2">
                        {incomingRequests?.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-2 border rounded-md">
                                <p className="text-sm">{req.fromUsername} wants to be your {req.type === `seeking_${offerer.singular}` ? seeker.singular : offerer.singular}.</p>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleRequest(req, 'accepted')}>Accept</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleRequest(req, 'declined')}>Decline</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {connectionList(offerers, offerer)}
                    {connectionList(seekers, seeker)}
                </div>
            </CardContent>
        </Card>
    );
}

function Finder({ config, currentUserProfile }: { config: MatchingConfig; currentUserProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { fields, offerer, seeker } = config;
    const [skillFilter, setSkillFilter] = useState('');
    const [nameSearch, setNameSearch] = useState('');
    const debouncedNameSearch = useDebounce(nameSearch, 300);

    const peopleQuery = (role: Role, skillsField: ProfileList) => {
        const baseQuery = query(
            collection(firestore, 'users'),
            where(fields.status, '==', 'open'),
            where(fields.role, 'in', [role.singular, 'both'])
        );
        return skillFilter ? query(baseQuery, where(skillsField, 'array-contains', skillFilter)) : baseQuery;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const offerersQuery = useMemo(() => peopleQuery(offerer, fields.offerSkills), [firestore, skillFilter, config]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const seekersQuery = useMemo(() => peopleQuery(seeker, fields.seekSkills), [firestore, skillFilter, config]);

    const { data: allOfferers, isLoading: offerersLoading } = useCollection<UserProfile>(offerersQuery);
    const { data: allSeekers, isLoading: seekersLoading } = useCollection<UserProfile>(seekersQuery);

    const byName = (people: UserProfile[] | null) => {
        if (!people || !debouncedNameSearch) return people;
        const searchLower = debouncedNameSearch.toLowerCase();
        return people.filter(p => p.username_lowercase?.includes(searchLower));
    };

    const requestsSentQuery = useMemo(() => query(
        collection(firestore, config.requestsCollection),
        where('fromUid', '==', currentUserProfile.id)
    ), [firestore, currentUserProfile.id, config.requestsCollection]);
    const { data: sentRequests, isLoading: sentLoading } = useCollection<MatchingRequest>(requestsSentQuery);

    const receivedRequestsQuery = useMemo(() => query(
        collection(firestore, config.requestsCollection),
        where('toUid', '==', currentUserProfile.id)
    ), [firestore, currentUserProfile.id, config.requestsCollection]);
    const { data: receivedRequests, isLoading: receivedLoading } = useCollection<MatchingRequest>(receivedRequestsQuery);

    const allRequests = useMemo(() => {
        const combined = new Map<string, MatchingRequest>();
        (sentRequests || []).forEach(req => combined.set(req.id, req));
        (receivedRequests || []).forEach(req => combined.set(req.id, req));
        return Array.from(combined.values());
    }, [sentRequests, receivedRequests]);

    const sendRequest = async (targetUser: UserProfile, type: string) => {
        const requestsCollection = collection(firestore, config.requestsCollection);
        const requestData = {
            fromUid: currentUserProfile.id,
            fromUsername: currentUserProfile.username,
            toUid: targetUser.id,
            toUsername: targetUser.username,
            type,
            status: 'pending' as const,
            createdAt: serverTimestamp()
        };

        try {
            await addDoc(requestsCollection, requestData);
            toast({ title: "Request Sent!", description: `Your ${config.program.toLowerCase()} request has been sent to ${targetUser.username}.` });
        } catch {
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

    const userList = (people: UserProfile[] | null, role: Role, skillsField: ProfileList) => {
        if (!people || people.length === 0) {
            return <p className="text-muted-foreground text-center py-8">No {role.plural} found matching your criteria.</p>;
        }

        return (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {people.filter(p => p.id !== currentUserProfile.id).map(person => {
                    const relevantRequest = allRequests.find(req =>
                        (req.fromUid === currentUserProfile.id && req.toUid === person.id) ||
                        (req.fromUid === person.id && req.toUid === currentUserProfile.id)
                    );
                    const connectionId = connectionIdFor(currentUserProfile.id, person.id);
                    const isConnected = listOf(currentUserProfile, fields.connectionIds).includes(connectionId);
                    const requestType = `seeking_${role.singular}`;

                    let button;
                    if (isConnected) {
                        button = (
                            <Button asChild className="w-full" variant="secondary">
                                <Link href={`${config.connectionsRoute}/${connectionId}`}>Dashboard</Link>
                            </Button>
                        );
                    } else if (relevantRequest?.status === 'pending') {
                        button = <Button className="w-full" disabled>Pending</Button>;
                    } else if (relevantRequest?.status === 'accepted') {
                        button = <Button className="w-full" disabled variant="secondary">Connected</Button>;
                    } else if (relevantRequest?.status === 'declined') {
                        button = <Button className="w-full" disabled variant="outline">Declined</Button>;
                    } else {
                        button = <Button className="w-full" onClick={() => sendRequest(person, requestType)}>Request</Button>;
                    }

                    return (
                        <Card key={person.id}>
                            <CardHeader className="flex-row items-center gap-4">
                                <Link href={`/users/${person.id}`}><Avatar><AvatarImage src={person.profilePictureUrl} /><AvatarFallback>{person.username.charAt(0)}</AvatarFallback></Avatar></Link>
                                <div>
                                    <Link href={`/users/${person.id}`}><CardTitle className="text-base line-clamp-1">{person.username}</CardTitle></Link>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {listOf(person, skillsField).slice(0, 3).map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {button}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        );
    };

    const isLoading = offerersLoading || seekersLoading || sentLoading || receivedLoading;

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
                <Tabs defaultValue="offerers">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="offerers">Find a {offerer.title}</TabsTrigger>
                        <TabsTrigger value="seekers">Find a {seeker.title}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="offerers" className="pt-4">
                        {isLoading ? <p>Loading {offerer.plural}...</p> : userList(byName(allOfferers), offerer, fields.offerSkills)}
                    </TabsContent>
                    <TabsContent value="seekers" className="pt-4">
                        {isLoading ? <p>Loading {seeker.plural}...</p> : userList(byName(allSeekers), seeker, fields.seekSkills)}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

export default function MatchingProgram({ config }: { config: MatchingConfig }) {
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
            router.push(`/login?redirect=${config.pageRoute}`);
        }
    }, [user, isUserLoading, router, config.pageRoute]);

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
                <h1 className="text-3xl font-headline mt-4">{config.program} Program</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{config.intro}</p>
            </div>
            <SetupForm config={config} user={user} userProfile={userProfile} />
            <Dashboard config={config} user={user} userProfile={userProfile} />
            <Finder config={config} currentUserProfile={userProfile} />
        </div>
    );
}
