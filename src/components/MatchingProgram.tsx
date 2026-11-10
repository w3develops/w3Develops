'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useVerifiedGuard } from '@/lib/hooks/useVerifiedGuard';
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { useState, useMemo, type ReactNode } from "react";
import { useDocsByIds } from "@/lib/hooks/useDocsByIds";
import { useConnections } from "@/lib/hooks/useConnections";
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";
import { HowItWorks, SignInToJoin, type ProgramStep } from "@/components/ProgramPublicInfo";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, GraduationCap, GitBranch } from "lucide-react";
import { UserProfile } from "@/lib/types";
import { doc, DocumentReference, updateDoc, writeBatch, serverTimestamp, collection, addDoc, query, where } from "firebase/firestore";
import type { User } from "firebase/auth";
import { useToast } from "@/components/ui/use-toast";
import { topics } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useDebounce } from "@/lib/hooks/useDebounce";

type SkillsList = 'mentoringSkills' | 'seekingSkills' | 'tutoringSkills' | 'seekingTutoringSkills' | 'pairProgrammingSkills';

/**
 * A kind of person you can connect with: a mentor, a mentee, a pairing
 * partner... In programs with roles, connections name each side's person in
 * `{singular}Id`, like `mentorId`.
 */
interface Side {
    singular: string;
    plural: string;
    title: string;
    skills: SkillsList;    // the skills people list for this side
}

// Mentorship, tutoring and pair programming work the same way: people open
// their profile to requests, send requests, and accepted requests become a
// shared space. Only the names of the collections, profile fields and words
// differ, and whether members pick a role.
//
// The pages are server components that pass this config along, so it must
// stay plain data (the icon is a name, not a component).
interface ConfigBase {
    program: string;            // "Mentorship", used in headings and messages
    heading: string;            // the page's main heading
    icon: 'graduation-cap' | 'git-branch';
    dashboardTitle: string;
    intro: string;
    pageRoute: string;          // where this page lives, for the login redirect
    requestsCollection: string;
    connectionsCollection: string;
    connectionsRoute: string;
    statusField: 'mentorshipStatus' | 'tutorStatus' | 'pairProgrammingStatus';
}

/**
 * Members offer help, look for it, or both. Each request says which role the
 * sender wants filled, and the connection records who has which role.
 */
export interface RolesConfig extends ConfigBase {
    roleField: 'mentorshipRole' | 'tutorRole';
    offerer: Side;              // e.g. mentor
    seeker: Side;               // e.g. mentee
}

/** Everyone is alike, so there are no roles: you're open to requests or not. */
export interface PartnersConfig extends ConfigBase {
    partner: Side;
    text: {
        profileTitle: string;
        openLabel: string;      // the switch that opens your profile to requests
        openHint: string;
        skillsLabel: string;
        skillsPlaceholder: string;
        incomingRequest: string;  // follows the sender's name
        finderHint: string;
        requestButton: string;
        requestName: string;    // as in "Your pairing request has been sent"
        howItWorks: ProgramStep[];
    };
}

export type MatchingConfig = RolesConfig | PartnersConfig;

interface MatchingRequest {
    id: string;
    fromUid: string;
    fromUsername: string;
    toUid: string;
    toUsername: string;
    type?: string;              // only in programs with roles
    status: 'pending' | 'accepted' | 'declined';
}

type Status = 'open' | 'closed';

const icons = { 'graduation-cap': GraduationCap, 'git-branch': GitBranch };

const hasRoles = (config: MatchingConfig): config is RolesConfig => 'roleField' in config;
const sidesOf = (config: MatchingConfig): Side[] => hasRoles(config) ? [config.offerer, config.seeker] : [config.partner];
const listOf = (profile: UserProfile, field: SkillsList) => (profile[field] as string[] | undefined) || [];
const connectionIdFor = (a: string, b: string) => [a, b].sort().join('_');

function SetupForm({ config, user, userProfile }: { config: MatchingConfig; user: User; userProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const sides = sidesOf(config);
    const role = hasRoles(config) ? userProfile[config.roleField] as string | undefined : undefined;
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Which sides the member takes, in programs with roles
    const [taking, setTaking] = useState(sides.map(side => role === side.singular || role === 'both'));
    const [status, setStatus] = useState<Status>((userProfile[config.statusField] as Status | undefined) || 'closed');
    const [skills, setSkills] = useState(sides.map(side => listOf(userProfile, side.skills)));
    const [currentSkills, setCurrentSkills] = useState(sides.map(() => ''));

    // Without roles, being open to requests is what makes your skills count
    const isActive = (index: number) => hasRoles(config) ? taking[index] : status === 'open';

    const userDocRef = useMemo(() => doc(firestore, 'users', user.uid), [user, firestore]);

    const handleUpdate = async () => {
        setIsSubmitting(true);

        const updateData: Record<string, unknown> = {};
        if (hasRoles(config)) {
            let newRole = 'none';
            if (taking[0] && taking[1]) {
                newRole = 'both';
            } else if (taking[0]) {
                newRole = config.offerer.singular;
            } else if (taking[1]) {
                newRole = config.seeker.singular;
            }
            updateData[config.roleField] = newRole;
        }
        updateData[config.statusField] = status;
        sides.forEach((side, index) => {
            updateData[side.skills] = isActive(index) ? skills[index] : [];
        });
        updateData.skills = Array.from(new Set([...(userProfile.skills || []), ...skills.flat()]));

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

    const replaceAt = <T,>(list: T[], index: number, value: T) => list.map((item, i) => i === index ? value : item);

    const skillEditor = (index: number, label: string, placeholder: string) => {
        const sideSkills = skills[index];
        const current = currentSkills[index];
        const setSideSkills = (value: string[]) => setSkills(replaceAt(skills, index, value));
        const setCurrent = (value: string) => setCurrentSkills(replaceAt(currentSkills, index, value));
        const add = () => {
            if (current && !sideSkills.includes(current)) {
                setSideSkills([...sideSkills, current]);
                setCurrent('');
            }
        };
        return (
            <div key={sides[index].skills} className="space-y-2">
                <Label>{label}</Label>
                <div className="flex flex-wrap gap-2">
                    {sideSkills.map(skill => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-1">{skill}
                            <button onClick={() => setSideSkills(sideSkills.filter(s => s !== skill))}><X className="h-3 w-3"/></button>
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

    const statusSwitch = (label: string, hint: string) => (
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
                <Label htmlFor="status-switch" className="text-base">{label}</Label>
                <p className="text-sm text-muted-foreground">{hint}</p>
            </div>
            <Switch id="status-switch" checked={status === 'open'} onCheckedChange={(checked) => setStatus(checked ? 'open' : 'closed')} />
        </div>
    );

    let fields: ReactNode;
    if (hasRoles(config)) {
        const { offerer } = config;
        fields = (
            <>
                <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="offering-switch" className="text-base">Offer {config.program}</Label>
                            <p className="text-sm text-muted-foreground">Make yourself available as a {offerer.singular} for others.</p>
                        </div>
                        <Switch id="offering-switch" checked={taking[0]} onCheckedChange={(checked) => setTaking(replaceAt(taking, 0, checked))} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="seeking-switch" className="text-base">Seek {config.program}</Label>
                            <p className="text-sm text-muted-foreground">Indicate that you are looking for a {offerer.singular}.</p>
                        </div>
                        <Switch id="seeking-switch" checked={taking[1]} onCheckedChange={(checked) => setTaking(replaceAt(taking, 1, checked))} />
                    </div>
                </div>

                {(taking[0] || taking[1]) && statusSwitch('Accepting New Requests', `Allow others to send you ${config.program.toLowerCase()} requests.`)}

                {taking[0] && skillEditor(0, `Skills You Can ${offerer.title} In`, 'e.g., React')}
                {taking[1] && skillEditor(1, 'Skills You Want to Learn', 'e.g., Python')}
            </>
        );
    } else {
        const { text } = config;
        fields = (
            <>
                {statusSwitch(text.openLabel, text.openHint)}
                {status === 'open' && skillEditor(0, text.skillsLabel, text.skillsPlaceholder)}
            </>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{hasRoles(config) ? `Your ${config.program} Profile` : config.text.profileTitle}</CardTitle>
                <CardDescription>
                    {hasRoles(config)
                        ? 'Set up your profile to start connecting with others.'
                        : `Set up your profile to start connecting with others for ${config.program.toLowerCase()}.`}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {fields}
                <Button onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Profile'}</Button>
            </CardContent>
        </Card>
    );
}

/** Incoming requests and current connections. Also shown on the account page. */
export function MatchingDashboard({ config, user, userProfile, title, children }: {
    config: MatchingConfig;
    user: User;
    userProfile: UserProfile;
    title?: string;
    children?: ReactNode;
}) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const sides = sidesOf(config);
    const Icon = icons[config.icon];

    const incomingRequestsQuery = useMemo(() => query(
        collection(firestore, config.requestsCollection),
        where('toUid', '==', user.uid),
        where('status', '==', 'pending')
    ), [firestore, user, config.requestsCollection]);

    const { data: incomingRequests, isLoading: isLoadingRequests } = useCollection<MatchingRequest>(incomingRequestsQuery);

    const ensureVerified = useVerifiedGuard();
    const handleRequest = async (request: MatchingRequest, newStatus: 'accepted' | 'declined') => {
        if (!ensureVerified()) return;
        const batch = writeBatch(firestore);
        batch.update(doc(firestore, config.requestsCollection, request.id), { status: newStatus });
        let batchUpdateData = {};

        // Accepting saves the shared connection, which is the record of who's
        // in it; profiles don't keep their own copy
        if (newStatus === 'accepted') {
            const connectionId = connectionIdFor(request.fromUid, user.uid);
            const connection: Record<string, unknown> = {
                id: connectionId,
                // The rules check the connection against the request it came from
                requestId: request.id,
                memberIds: [request.fromUid, user.uid].sort(),
                createdAt: serverTimestamp()
            };

            if (hasRoles(config)) {
                const { offerer, seeker } = config;
                // The requester asked me to be their offerer, or offered to be mine
                const iAmOfferer = request.type === `seeking_${offerer.singular}`;
                connection[`${offerer.singular}Id`] = iAmOfferer ? user.uid : request.fromUid;
                connection[`${seeker.singular}Id`] = iAmOfferer ? request.fromUid : user.uid;
            }

            batch.set(doc(firestore, config.connectionsCollection, connectionId), connection);
            batchUpdateData = { connection };
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

    const describeRequest = (request: MatchingRequest) => {
        if (!hasRoles(config)) return config.text.incomingRequest;
        const { offerer, seeker } = config;
        return `wants to be your ${request.type === `seeking_${offerer.singular}` ? seeker.singular : offerer.singular}.`;
    };

    // The connections themselves say who's in them, and who has which role
    const { data: connections } = useConnections(config.connectionsCollection, user.uid);
    const peopleOn = (side: Side) => (connections ?? []).flatMap(connection => {
        if (!hasRoles(config)) return connection.memberIds.filter(id => id !== user.uid);
        // My mentors are the mentors of the connections where I'm the mentee
        const opposite = side === config.offerer ? config.seeker : config.offerer;
        return connection[`${opposite.singular}Id`] === user.uid ? [connection[`${side.singular}Id`] as string] : [];
    });

    // A program has one or two sides, so the second may load nothing
    const { data: firstSide } = useDocsByIds<UserProfile>('users', peopleOn(sides[0]));
    const { data: secondSide } = useDocsByIds<UserProfile>('users', sides[1] ? peopleOn(sides[1]) : []);

    const connectionList = (people: UserProfile[] | null, side: Side) => (
        <div key={side.singular}>
            <h3 className="font-semibold mb-2">Your {side.title}s</h3>
            {people && people.length > 0 ? (
                <ul className="divide-y">
                    {people.map(person => (
                        <li key={person.id} className="py-2">
                            <Link href={`${config.connectionsRoute}/${connectionIdFor(user.uid, person.id)}`} className="font-medium hover:underline">{person.username}</Link>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-sm text-muted-foreground">You have no {side.plural} yet.</p>}
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Icon />{title ?? config.dashboardTitle}</CardTitle>
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
                                <p className="text-sm">{req.fromUsername} {describeRequest(req)}</p>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleRequest(req, 'accepted')}>Accept</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleRequest(req, 'declined')}>Decline</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {sides[1] ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {connectionList(firstSide, sides[0])}
                        {connectionList(secondSide, sides[1])}
                    </div>
                ) : connectionList(firstSide, sides[0])}
                {children}
            </CardContent>
        </Card>
    );
}

function Finder({ config, currentUserProfile }: { config: MatchingConfig; currentUserProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const sides = sidesOf(config);
    const [skillFilter, setSkillFilter] = useState('');
    const [nameSearch, setNameSearch] = useState('');
    const debouncedNameSearch = useDebounce(nameSearch, 300);

    const peopleQuery = (side: Side) => {
        let peopleQuery = query(collection(firestore, 'users'), where(config.statusField, '==', 'open'));
        if (hasRoles(config)) {
            peopleQuery = query(peopleQuery, where(config.roleField, 'in', [side.singular, 'both']));
        }
        return skillFilter ? query(peopleQuery, where(side.skills, 'array-contains', skillFilter)) : peopleQuery;
    };

    // A program has one or two sides, so the second may load nothing
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const firstQuery = useMemo(() => peopleQuery(sides[0]), [firestore, skillFilter, config]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const secondQuery = useMemo(() => sides[1] ? peopleQuery(sides[1]) : null, [firestore, skillFilter, config]);

    const { data: allFirst, isLoading: firstLoading } = useCollection<UserProfile>(firstQuery);
    const { data: allSecond, isLoading: secondLoading } = useCollection<UserProfile>(secondQuery);

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

    const { data: connections } = useConnections(config.connectionsCollection, currentUserProfile.id);
    const connectedIds = useMemo(() => new Set((connections ?? []).map(connection => connection.id)), [connections]);

    const allRequests = useMemo(() => {
        const combined = new Map<string, MatchingRequest>();
        (sentRequests || []).forEach(req => combined.set(req.id, req));
        (receivedRequests || []).forEach(req => combined.set(req.id, req));
        return Array.from(combined.values());
    }, [sentRequests, receivedRequests]);

    const ensureVerified = useVerifiedGuard();
    const sendRequest = async (targetUser: UserProfile, side: Side) => {
        if (!ensureVerified()) return;
        const requestsCollection = collection(firestore, config.requestsCollection);
        const requestData = {
            fromUid: currentUserProfile.id,
            fromUsername: currentUserProfile.username,
            toUid: targetUser.id,
            toUsername: targetUser.username,
            // Which role the sender wants filled, in programs with roles
            ...(hasRoles(config) ? { type: `seeking_${side.singular}` } : {}),
            status: 'pending' as const,
            createdAt: serverTimestamp()
        };
        const requestName = hasRoles(config) ? config.program.toLowerCase() : config.text.requestName;

        try {
            await addDoc(requestsCollection, requestData);
            toast({ title: "Request Sent!", description: `Your ${requestName} request has been sent to ${targetUser.username}.` });
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

    const userList = (people: UserProfile[] | null, side: Side) => {
        if (!people || people.length === 0) {
            return <p className="text-muted-foreground text-center py-8">No {side.plural} found matching your criteria.</p>;
        }

        return (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {people.filter(p => p.id !== currentUserProfile.id).map(person => {
                    const relevantRequest = allRequests.find(req =>
                        (req.fromUid === currentUserProfile.id && req.toUid === person.id) ||
                        (req.fromUid === person.id && req.toUid === currentUserProfile.id)
                    );
                    const connectionId = connectionIdFor(currentUserProfile.id, person.id);
                    const isConnected = connectedIds.has(connectionId);

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
                        button = (
                            <Button className="w-full" onClick={() => sendRequest(person, side)}>
                                {hasRoles(config) ? 'Request' : config.text.requestButton}
                            </Button>
                        );
                    }

                    return (
                        <Card key={person.id}>
                            <CardHeader className="flex-row items-center gap-4">
                                <Link href={`/users/${person.id}`}><Avatar><AvatarImage src={person.profilePictureUrl} /><AvatarFallback>{person.username.charAt(0)}</AvatarFallback></Avatar></Link>
                                <div>
                                    <Link href={`/users/${person.id}`}><CardTitle className="text-base line-clamp-1">{person.username}</CardTitle></Link>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {listOf(person, side.skills).slice(0, 3).map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
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

    const isLoading = firstLoading || secondLoading || sentLoading || receivedLoading;

    let results: ReactNode;
    if (hasRoles(config)) {
        const { offerer, seeker } = config;
        results = (
            <Tabs defaultValue="offerers">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="offerers">Find a {offerer.title}</TabsTrigger>
                    <TabsTrigger value="seekers">Find a {seeker.title}</TabsTrigger>
                </TabsList>
                <TabsContent value="offerers" className="pt-4">
                    {isLoading ? <p>Loading {offerer.plural}...</p> : userList(byName(allFirst), offerer)}
                </TabsContent>
                <TabsContent value="seekers" className="pt-4">
                    {isLoading ? <p>Loading {seeker.plural}...</p> : userList(byName(allSecond), seeker)}
                </TabsContent>
            </Tabs>
        );
    } else {
        results = isLoading ? <p>Loading potential {config.partner.plural}...</p> : userList(byName(allFirst), config.partner);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{hasRoles(config) ? 'Find a Connection' : `Find a ${config.partner.title}`}</CardTitle>
                <CardDescription>
                    {hasRoles(config) ? 'Browse and filter to find the right person to connect with.' : config.text.finderHint}
                </CardDescription>
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
                {results}
            </CardContent>
        </Card>
    );
}

export default function MatchingProgram({ config }: { config: MatchingConfig }) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const Icon = icons[config.icon];

    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    let signInAction: string;
    let steps: ProgramStep[];
    if (hasRoles(config)) {
        const { offerer, seeker } = config;
        signInAction = `find a ${offerer.singular} or ${seeker.singular}`;
        steps = [
            {
                title: `Set up your ${config.program.toLowerCase()} profile`,
                text: `Choose whether you want to be a ${offerer.singular}, a ${seeker.singular} or both, list the skills you can share or want to learn, and open your profile to requests.`,
            },
            {
                title: 'Find a match',
                text: `Browse members by skill and send a request to the ${offerer.singular} or ${seeker.singular} you'd like to work with.`,
            },
            {
                title: 'Work together',
                text: 'Once your request is accepted, you share a private dashboard with real-time notes, a task list and check-ins. It\'s all free.',
            },
        ];
    } else {
        signInAction = `find a ${config.program.toLowerCase()} ${config.partner.singular}`;
        steps = config.text.howItWorks;
    }

    // The heading and "How it works" don't depend on who is signed in, so they
    // are always rendered, which lets search engines read the page too
    let memberTools: ReactNode;
    if (!isUserLoading && !user) {
        memberTools = <SignInToJoin action={signInAction} returnTo={config.pageRoute} />;
    } else if (isUserLoading || isProfileLoading || !user || !userProfile) {
        memberTools = <LoadingSkeleton />;
    } else {
        memberTools = (
            <>
                <SetupForm config={config} user={user} userProfile={userProfile} />
                <MatchingDashboard config={config} user={user} userProfile={userProfile} />
                <Finder config={config} currentUserProfile={userProfile} />
            </>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8">
            <div className="text-center">
                <Icon className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-3xl font-headline mt-4">{config.heading}</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{config.intro}</p>
            </div>
            {memberTools}
            <HowItWorks steps={steps} />
        </div>
    );
}
