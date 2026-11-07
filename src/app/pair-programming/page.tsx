'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useVerifiedGuard } from '@/lib/hooks/useVerifiedGuard';
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
import { X, Search, GitBranch } from "lucide-react";
import { UserProfile, PairProgrammingStatus, PairingRequest } from "@/lib/types";
import { doc, DocumentReference, updateDoc, serverTimestamp, collection, addDoc, query, where } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { topics } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useDebounce } from "@/lib/hooks/useDebounce";
import PairingDashboard from '@/components/PairingDashboard';
import type { User } from 'firebase/auth';

function PairingSetupForm({ user, userProfile }: { user: User, userProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [status, setStatus] = useState<PairProgrammingStatus>(userProfile.pairProgrammingStatus || 'closed');
    const [pairingSkills, setPairingSkills] = useState<string[]>(userProfile.pairProgrammingSkills || []);
    const [currentSkill, setCurrentSkill] = useState('');

    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
    }, [user, firestore]);

    const handleUpdate = async () => {
        if (!userDocRef) return;
        setIsSubmitting(true);

        const existingSkills = userProfile.skills || [];
        const combinedSkills = Array.from(new Set([...existingSkills, ...pairingSkills]));

        const updateData = {
            pairProgrammingStatus: status,
            pairProgrammingSkills: status === 'open' ? pairingSkills : [],
            skills: combinedSkills,
        };

        try {
            await updateDoc(userDocRef, updateData);
            toast({ title: "Success", description: "Your pair programming profile has been updated." });
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
    
    const handleAddSkill = () => {
        if (currentSkill && !pairingSkills.includes(currentSkill)) {
            setPairingSkills([...pairingSkills, currentSkill]);
            setCurrentSkill('');
        }
    };
    
    const handleRemoveSkill = (skill: string) => {
        setPairingSkills(pairingSkills.filter(s => s !== skill));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Pairing Profile</CardTitle>
                <CardDescription>Set up your profile to start connecting with others for pair programming.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="status-switch" className="text-base">Open to Pairing</Label>
                        <p className="text-sm text-muted-foreground">Allow others to send you pairing requests.</p>
                    </div>
                    <Switch id="status-switch" checked={status === 'open'} onCheckedChange={(checked) => setStatus(checked ? 'open' : 'closed')} />
                </div>
                
                { status === 'open' && (
                    <div className="space-y-2">
                        <Label>Skills/Topics for Pairing</Label>
                        <div className="flex flex-wrap gap-2">
                            {pairingSkills.map(skill => (
                                <Badge key={skill} variant="secondary" className="flex items-center gap-1">{skill}
                                    <button onClick={() => handleRemoveSkill(skill)}><X className="h-3 w-3"/></button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input value={currentSkill} onChange={e => setCurrentSkill(e.target.value)} placeholder="e.g., React Hooks, TDD" onKeyDown={e => e.key === 'Enter' && handleAddSkill()}/>
                            <Button type="button" variant="outline" onClick={handleAddSkill}>Add</Button>
                        </div>
                    </div>
                )}
                
                <Button onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Profile'}</Button>
            </CardContent>
        </Card>
    )
}

function PairingFinder({ currentUserProfile }: { currentUserProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [skillFilter, setSkillFilter] = useState('');
    const [nameSearch, setNameSearch] = useState('');
    const debouncedNameSearch = useDebounce(nameSearch, 300);

    const partnersQuery = useMemo(() => {
        let q = query(
            collection(firestore, 'users'),
            where('pairProgrammingStatus', '==', 'open')
        );
        if (skillFilter) {
            q = query(q, where('pairProgrammingSkills', 'array-contains', skillFilter));
        }
        return q;
    }, [firestore, skillFilter]);
    
    const { data: allPartners, isLoading: partnersLoading } = useCollection<UserProfile>(partnersQuery);
    
    const partners = useMemo(() => {
        if (!allPartners) return null;
        if (!debouncedNameSearch) return allPartners;
        const searchLower = debouncedNameSearch.toLowerCase();
        return allPartners.filter(p => p.username_lowercase?.includes(searchLower));
    }, [allPartners, debouncedNameSearch]);

    const requestsSentQuery = useMemo(() => {
        if (!currentUserProfile.id) return null;
        return query(collection(firestore, 'pairRequests'), where('fromUid', '==', currentUserProfile.id));
    }, [firestore, currentUserProfile.id]);
    
    const { data: sentRequests, isLoading: sentLoading } = useCollection<PairingRequest>(requestsSentQuery);
    
    const receivedRequestsQuery = useMemo(() => {
        if (!currentUserProfile.id) return null;
        return query(collection(firestore, 'pairRequests'), where('toUid', '==', currentUserProfile.id));
    }, [firestore, currentUserProfile.id]);
    
    const { data: receivedRequests, isLoading: receivedLoading } = useCollection<PairingRequest>(receivedRequestsQuery);

    const allRequests = useMemo(() => {
        const combined = new Map<string, PairingRequest>();
        (sentRequests || []).forEach(req => combined.set(req.id, req));
        (receivedRequests || []).forEach(req => combined.set(req.id, req));
        return Array.from(combined.values());
    }, [sentRequests, receivedRequests]);

    const ensureVerified = useVerifiedGuard();
    const handleRequest = async (targetUser: UserProfile) => {
        if (!ensureVerified()) return;
        const requestsCollection = collection(firestore, 'pairRequests');
        const requestData = {
            fromUid: currentUserProfile.id,
            fromUsername: currentUserProfile.username,
            toUid: targetUser.id,
            toUsername: targetUser.username,
            status: 'pending' as const,
            createdAt: serverTimestamp()
        };

        try {
            await addDoc(requestsCollection, requestData);
            toast({ title: "Request Sent!", description: `Your pairing request has been sent to ${targetUser.username}.`})
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
    
    // A plain function rather than a component defined in here, which React
    // would treat as a brand-new component on every render
    const renderUserList = (users: UserProfile[] | null, allRequests: PairingRequest[]) => {
        if (!users || users.length === 0) {
            return <p className="text-muted-foreground text-center py-8">No partners found matching your criteria.</p>
        }

        return (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.filter(u => u.id !== currentUserProfile.id).map(user => {
                    const relevantRequest = allRequests.find(req => 
                        (req.fromUid === currentUserProfile.id && req.toUid === user.id) || 
                        (req.fromUid === user.id && req.toUid === currentUserProfile.id)
                    );
                    const pairingId = [currentUserProfile.id, user.id].sort().join('_');
                    const isConnected = currentUserProfile.pairingIds?.includes(pairingId);

                    let button;
                    if (isConnected) {
                        button = <Button asChild className="w-full" variant="secondary"><Link href={`/pairings/${pairingId}`}>Dashboard</Link></Button>;
                    } else if (relevantRequest) {
                        button = <Button className="w-full" disabled>{relevantRequest.status.charAt(0).toUpperCase() + relevantRequest.status.slice(1)}</Button>;
                    } else {
                         button = <Button className="w-full" onClick={() => handleRequest(user)}>Request to Pair</Button>;
                    }

                    return (
                        <Card key={user.id}>
                            <CardHeader className="flex-row items-center gap-4">
                                <Link href={`/users/${user.id}`}><Avatar><AvatarImage src={user.profilePictureUrl} /><AvatarFallback>{user.username.charAt(0)}</AvatarFallback></Avatar></Link>
                                <div>
                                    <Link href={`/users/${user.id}`}><CardTitle className="text-base line-clamp-1">{user.username}</CardTitle></Link>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {user.pairProgrammingSkills?.slice(0, 3).map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
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

    const isLoading = partnersLoading || sentLoading || receivedLoading;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Find a Partner</CardTitle>
                <CardDescription>Browse and filter to find someone to pair program with.</CardDescription>
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
                {isLoading ? <p>Loading potential partners...</p> : renderUserList(partners, allRequests)}
            </CardContent>
        </Card>
    )
}

export default function PairProgrammingPage() {
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
            router.push('/login?redirect=/pair-programming');
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
                <GitBranch className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-3xl font-headline mt-4">Pair Programming</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Find a partner, share knowledge, and build together in real-time.
                </p>
            </div>
            <PairingSetupForm user={user} userProfile={userProfile} />
            <PairingDashboard user={user} userProfile={userProfile} />
            <PairingFinder currentUserProfile={userProfile} />
        </div>
    );
}
