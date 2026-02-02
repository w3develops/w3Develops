
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
import { doc, DocumentReference, updateDoc, writeBatch, serverTimestamp, collection, addDoc, query, where, Timestamp } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { topics } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';

function MentorshipSetupForm({ user, userProfile }: { user: any, userProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [role, setRole] = useState<MentorshipRole>(userProfile.mentorshipRole || 'none');
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
        try {
            await updateDoc(userDocRef, {
                mentorshipRole: role,
                mentorshipStatus: status,
                mentoringSkills: mentoringSkills,
                seekingSkills: seekingSkills,
            });
            toast({ title: "Success", description: "Your mentorship profile has been updated." });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message });
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
                <div className="space-y-2">
                    <Label>Your Role</Label>
                     <Select value={role} onValueChange={(value: MentorshipRole) => setRole(value)}>
                        <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Not participating</SelectItem>
                            <SelectItem value="mentor">Mentor</SelectItem>
                            <SelectItem value="mentee">Mentee</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="status-switch" className="text-base">Accepting New Requests</Label>
                        <p className="text-sm text-muted-foreground">Allow others to send you mentorship requests.</p>
                    </div>
                    <Switch id="status-switch" checked={status === 'open'} onCheckedChange={(checked) => setStatus(checked ? 'open' : 'closed')} />
                </div>
                
                { (role === 'mentor' || role === 'both') && (
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
                
                { (role === 'mentee' || role === 'both') && (
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

    const handleRequest = async (targetUser: UserProfile, type: MentorshipRequest['type']) => {
        try {
            const requestsCollection = collection(firestore, 'mentorshipRequests');
            await addDoc(requestsCollection, {
                fromUid: currentUserProfile.id,
                fromUsername: currentUserProfile.username,
                toUid: targetUser.id,
                toUsername: targetUser.username,
                type: type,
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            toast({ title: "Request Sent!", description: `Your mentorship request has been sent to ${targetUser.username}.`})
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: `Could not send request: ${error.message}`});
        }
    };
    
    const UserList = ({ users, type }: { users: UserProfile[] | null, type: 'mentor' | 'mentee' }) => {
        if (!users || users.length === 0) {
            return <p className="text-muted-foreground text-center py-8">No {type}s found matching your criteria.</p>
        }

        return (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.filter(u => u.id !== currentUserProfile.id).map(user => (
                    <Card key={user.id}>
                        <CardHeader className="flex-row items-center gap-4">
                            <Link href={`/users/${user.id}`}><Avatar><AvatarImage src={user.profilePictureUrl} /><AvatarFallback>{user.username.charAt(0)}</AvatarFallback></Avatar></Link>
                            <div>
                                <Link href={`/users/${user.id}`}><CardTitle>{user.username}</CardTitle></Link>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {(type === 'mentor' ? user.mentoringSkills : user.seekingSkills)?.slice(0, 3).map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <Button className="w-full" onClick={() => handleRequest(user, type === 'mentor' ? 'seeking_mentor' : 'seeking_mentee' )}>Request</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Find a Connection</CardTitle>
                <CardDescription>Browse and filter to find the right person to connect with.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex gap-2">
                    <Search className="absolute left-9 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Select value={skillFilter} onValueChange={(value) => setSkillFilter(value === 'all-skills' ? '' : value)}>
                        <SelectTrigger><SelectValue placeholder="Filter by skill..." /></SelectTrigger>
                        <SelectContent>
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
                        {mentorsLoading ? <p>Loading mentors...</p> : <UserList users={mentors} type="mentor" />}
                    </TabsContent>
                    <TabsContent value="mentees" className="pt-4">
                        {menteesLoading ? <p>Loading mentees...</p> : <UserList users={mentees} type="mentee" />}
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

    const isLoading = isUserLoading || isProfileLoading;

    if (isLoading || !userProfile) {
        return <LoadingSkeleton />;
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
            <MentorshipFinder currentUserProfile={userProfile} />
        </div>
    );
}
