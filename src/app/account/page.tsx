
'use client';

import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { useMemo, useEffect, useState } from 'react';
import { doc, DocumentReference, collection, query, where, Query, documentId, writeBatch, arrayUnion, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserProfile, StudyGroup, GroupProject, SoloProject, BookClub, MentorshipRequest, TutorRequest, PairingRequest, Meetup } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Github, Linkedin, Twitter, PlusCircle, Star, GraduationCap, BrainCircuit, GitBranch, CheckSquare } from 'lucide-react';
import { JoinCohortModal } from '@/components/modals/JoinCohortModal';
import { JoinGroupModal } from '@/components/modals/JoinGroupModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SubmitSoloProjectForm from '@/components/forms/SubmitSoloProjectForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JoinBookClubModal } from '@/components/modals/JoinBookClubModal';
import { useToast } from '@/components/ui/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import ActivityFeed from '@/components/ActivityFeed';

function AccountPageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="rounded-full bg-muted h-24 w-24 flex-shrink-0"></div>
        <div className="space-y-2 w-full">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
          <div className="h-4 bg-muted rounded w-80"></div>
          <div className="flex gap-2 pt-2">
            <div className="h-10 w-32 bg-muted rounded-md"></div>
            <div className="h-10 w-32 bg-muted rounded-md"></div>
          </div>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="h-6 w-48 bg-muted rounded"></div>
        <div className="h-4 w-64 bg-muted rounded"></div>
        <div className="space-y-4 pt-4">
            <div className="h-16 bg-muted/50 rounded-lg"></div>
            <div className="h-16 bg-muted/50 rounded-lg"></div>
            <div className="h-16 bg-muted/50 rounded-lg"></div>
        </div>
      </div>
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 space-y-3">
          <div className="h-6 w-48 bg-muted rounded"></div>
          <div className="h-4 w-64 bg-muted rounded"></div>
          <div className="h-10 mt-4 w-full bg-muted rounded"></div>
          <div className="h-10 w-full bg-muted rounded"></div>
        </div>
         <div className="rounded-lg border bg-card p-6 space-y-3">
          <div className="h-6 w-48 bg-muted rounded"></div>
          <div className="h-4 w-64 bg-muted rounded"></div>
          <div className="h-10 mt-4 w-full bg-muted rounded"></div>
          <div className="h-10 w-full bg-muted rounded"></div>
        </div>
        <div className="rounded-lg border bg-card p-6 space-y-3">
          <div className="h-6 w-48 bg-muted rounded"></div>
          <div className="h-4 w-64 bg-muted rounded"></div>
          <div className="h-10 mt-4 w-full bg-muted rounded"></div>
          <div className="h-10 w-full bg-muted rounded"></div>
        </div>
      </div>
    </div>
  )
}

function MentorshipManagement({ user, userProfile }: { user: any, userProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const incomingRequestsQuery = useMemo(() => {
        return query(
            collection(firestore, 'mentorshipRequests'),
            where('toUid', '==', user.uid),
            where('status', '==', 'pending')
        );
    }, [firestore, user.uid]);

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
            const permissionError = new FirestorePermissionError({
                path: `batch write for mentorship request ${request.id}`,
                operation: 'update',
                requestResourceData: batchUpdateData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Failed to accept request due to a permission issue. Please check your permissions and try again.",
                duration: 10000
            });
        }
    };
    
    const mentorsQuery = useMemo(() => {
        if (!userProfile.mentorIds || userProfile.mentorIds.length === 0) return null;
        return query(collection(firestore, 'users'), where(documentId(), 'in', userProfile.mentorIds.slice(0, 10)));
    }, [firestore, userProfile.mentorIds]);
    const { data: mentors } = useCollection<UserProfile>(mentorsQuery);

    const menteesQuery = useMemo(() => {
        if (!userProfile.menteeIds || userProfile.menteeIds.length === 0) return null;
        return query(collection(firestore, 'users'), where(documentId(), 'in', userProfile.menteeIds.slice(0, 10)));
    }, [firestore, userProfile.menteeIds]);
    const { data: mentees } = useCollection<UserProfile>(menteesQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><GraduationCap />Mentorship</CardTitle>
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

                 <Button asChild variant="secondary" className="w-full">
                    <Link href="/mentorship">Explore Mentorship Program</Link>
                </Button>
            </CardContent>
        </Card>
    )
}

function TutorshipManagement({ user, userProfile }: { user: any, userProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const incomingRequestsQuery = useMemo(() => {
        return query(
            collection(firestore, 'tutorRequests'),
            where('toUid', '==', user.uid),
            where('status', '==', 'pending')
        );
    }, [firestore, user.uid]);

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
                description: "Failed to accept request due to a permission issue. Please check your permissions and try again.",
                duration: 10000
            });
        }
    };
    
    const tutorsQuery = useMemo(() => {
        if (!userProfile.tutorIds || userProfile.tutorIds.length === 0) return null;
        return query(collection(firestore, 'users'), where(documentId(), 'in', userProfile.tutorIds.slice(0, 10)));
    }, [firestore, userProfile.tutorIds]);
    const { data: tutors } = useCollection<UserProfile>(tutorsQuery);

    const studentsQuery = useMemo(() => {
        if (!userProfile.studentIds || userProfile.studentIds.length === 0) return null;
        return query(collection(firestore, 'users'), where(documentId(), 'in', userProfile.studentIds.slice(0, 10)));
    }, [firestore, userProfile.studentIds]);
    const { data: students } = useCollection<UserProfile>(studentsQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><GraduationCap />Tutorship</CardTitle>
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

                 <Button asChild variant="secondary" className="w-full">
                    <Link href="/tutor">Explore Tutoring Program</Link>
                </Button>
            </CardContent>
        </Card>
    )
}

function PairingManagement({ user, userProfile }: { user: any, userProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const incomingRequestsQuery = useMemo(() => {
        return query(
            collection(firestore, 'pairRequests'),
            where('toUid', '==', user.uid),
            where('status', '==', 'pending')
        );
    }, [firestore, user.uid]);

    const { data: incomingRequests, isLoading: isLoadingRequests } = useCollection<PairingRequest>(incomingRequestsQuery);

    const handleRequest = async (request: PairingRequest, newStatus: 'accepted' | 'declined') => {
        const requestRef = doc(firestore, 'pairRequests', request.id);
        const batch = writeBatch(firestore);

        batch.update(requestRef, { status: newStatus });
        let batchUpdateData = {};

        if (newStatus === 'accepted') {
            const requesterRef = doc(firestore, 'users', request.fromUid);
            const currentUserRef = doc(firestore, 'users', user.uid);
            const sortedUserIds = [request.fromUid, user.uid].sort();
            const pairingId = sortedUserIds.join('_');
            const pairingRef = doc(firestore, 'pairings', pairingId);
            
            batch.update(requesterRef, { pairingIds: arrayUnion(pairingId), pairPartnerIds: arrayUnion(user.uid) });
            batch.update(currentUserRef, { pairingIds: arrayUnion(pairingId), pairPartnerIds: arrayUnion(request.fromUid) });

            batch.set(pairingRef, {
                id: pairingId,
                memberIds: sortedUserIds,
                createdAt: serverTimestamp()
            });
            batchUpdateData = { from: request.fromUid, to: user.uid, pairingId };
        }
        
        try {
            await batch.commit();
            toast({ title: `Request ${newStatus}` });
        } catch (serverError) {
            const permissionError = new FirestorePermissionError({
                path: `batch write for pairing request ${request.id}`,
                operation: 'update',
                requestResourceData: batchUpdateData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Failed to accept request due to a permission issue.",
                duration: 10000
            });
        }
    };
    
    const partnersQuery = useMemo(() => {
        if (!userProfile.pairPartnerIds || userProfile.pairPartnerIds.length === 0) return null;
        return query(collection(firestore, 'users'), where(documentId(), 'in', userProfile.pairPartnerIds.slice(0, 10)));
    }, [firestore, userProfile.pairPartnerIds]);
    const { data: partners } = useCollection<UserProfile>(partnersQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><GitBranch />Pair Programming</CardTitle>
                <CardDescription>Manage your pair programming connections and requests.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Incoming Requests</h3>
                    {isLoadingRequests && <p>Loading requests...</p>}
                    {!isLoadingRequests && (!incomingRequests || incomingRequests.length === 0) && <p className="text-sm text-muted-foreground">No new requests.</p>}
                    <div className="space-y-2">
                        {incomingRequests?.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-2 border rounded-md">
                                <p className="text-sm">{req.fromUsername} wants to pair with you.</p>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleRequest(req, 'accepted')}>Accept</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleRequest(req, 'declined')}>Decline</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Your Partners</h3>
                    {partners && partners.length > 0 ? (
                        <ul className="divide-y">
                            {partners.map(p => {
                                const pairingId = [user.uid, p.id].sort().join('_');
                                return (
                                    <li key={p.id} className="py-2">
                                        <Link href={`/pairings/${pairingId}`} className="font-medium hover:underline">{p.username}</Link>
                                    </li>
                                )
                            })}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">You have no partners yet.</p>}
                </div>
                 <Button asChild variant="secondary" className="w-full">
                    <Link href="/pair-programming">Explore Pair Programming</Link>
                </Button>
            </CardContent>
        </Card>
    )
}

export default function AccountPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isBookClubModalOpen, setIsBookClubModalOpen] = useState(false);
  const [isSoloProjectModalOpen, setIsSoloProjectModalOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const userDocRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const userGroupsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, 'studyGroups'), where('memberIds', 'array-contains', user.uid)) as Query<StudyGroup>;
  }, [user, firestore]);

  const { data: studyGroups, isLoading: isGroupsLoading } = useCollection<StudyGroup>(userGroupsQuery);
  
  const userBookClubsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, 'bookClubs'), where('memberIds', 'array-contains', user.uid)) as Query<BookClub>;
  }, [user, firestore]);

  const { data: bookClubs, isLoading: isBookClubsLoading } = useCollection<BookClub>(userBookClubsQuery);

  const userGroupProjectsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, 'groupProjects'), where('memberIds', 'array-contains', user.uid)) as Query<GroupProject>;
  }, [user, firestore]);

  const { data: groupProjects, isLoading: isGroupProjectsLoading } = useCollection<GroupProject>(userGroupProjectsQuery);

  const userSoloProjectsQuery = useMemo(() => {
    if (!userProfile?.soloProjectIds || userProfile.soloProjectIds.length === 0) return null;
    return query(collection(firestore, 'soloProjects'), where(documentId(), 'in', userProfile.soloProjectIds.slice(0, 10))) as Query<SoloProject>;
  }, [userProfile?.soloProjectIds, firestore]);

  const { data: soloProjects, isLoading: isSoloProjectsLoading } = useCollection<SoloProject>(userSoloProjectsQuery);
  
  const starredSoloProjectsQuery = useMemo(() => {
      if (!userProfile?.starredSoloProjectIds || userProfile.starredSoloProjectIds.length === 0) return null;
      return query(collection(firestore, 'soloProjects'), where(documentId(), 'in', userProfile.starredSoloProjectIds.slice(0, 10))) as Query<SoloProject>;
  }, [userProfile?.starredSoloProjectIds, firestore]);
    
  const { data: starredProjects, isLoading: isStarredProjectsLoading } = useCollection<SoloProject>(starredSoloProjectsQuery);

  const createdMeetupsQuery = useMemo(() => {
    if (!userProfile?.createdMeetupIds || userProfile.createdMeetupIds.length === 0) return null;
    return query(collection(firestore, 'meetups'), where(documentId(), 'in', userProfile.createdMeetupIds.slice(0, 10))) as Query<Meetup>;
  }, [userProfile?.createdMeetupIds, firestore]);
  const { data: createdMeetups, isLoading: isLoadingCreatedMeetups } = useCollection<Meetup>(createdMeetupsQuery);

  const joinedMeetupsQuery = useMemo(() => {
      if (!userProfile?.joinedMeetupIds || userProfile.joinedMeetupIds.length === 0) return null;
      return query(collection(firestore, 'meetups'), where(documentId(), 'in', userProfile.joinedMeetupIds.slice(0, 10))) as Query<Meetup>;
  }, [userProfile?.joinedMeetupIds, firestore]);
  const { data: joinedMeetups, isLoading: isLoadingJoinedMeetups } = useCollection<Meetup>(joinedMeetupsQuery);


  if (isUserLoading || isProfileLoading || !userProfile) {
    return (
      <div className="p-4 md:p-10">
        <AccountPageSkeleton />
      </div>
    );
  }

  if (!user) {
    return <div className="p-4 md:p-10">Redirecting to login...</div>;
  }
  
  return (
    <div className="p-4 md:p-10">
      <JoinCohortModal isOpen={isCohortModalOpen} onClose={() => setIsCohortModalOpen(false)} />
      <JoinGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
      <JoinBookClubModal isOpen={isBookClubModalOpen} onClose={() => setIsBookClubModalOpen(false)} />

      <Dialog open={isSoloProjectModalOpen} onOpenChange={setIsSoloProjectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Showcase Your Work</DialogTitle>
            <DialogDescription>Submit your solo project to the community gallery.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SubmitSoloProjectForm 
              user={user} 
              userProfile={userProfile} 
              onSuccess={() => setIsSoloProjectModalOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <Avatar className="h-24 w-24 flex-shrink-0">
            <AvatarImage src={userProfile.profilePictureUrl || user.photoURL || ''} alt={userProfile.username || ''} />
            <AvatarFallback className="text-3xl">{userProfile.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-headline">Hello, {userProfile.username || user.email}!</h1>
          </div>
        </div>

        <ActivityFeed userProfile={userProfile} />

        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckSquare />My Tasks</CardTitle>
              <CardDescription>View all your tasks from all your groups and projects in one place.</CardDescription>
          </CardHeader>
          <CardContent>
              <Button asChild>
                  <Link href="/account/my-tasks">View My Tasks</Link>
              </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           <Card>
            <CardHeader>
              <CardTitle>Your Study Groups</CardTitle>
              <CardDescription>Groups you are a member of to learn and collaborate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isGroupsLoading ? <div className="h-10 w-full bg-muted rounded animate-pulse"></div> : 
                (studyGroups && studyGroups.length > 0) ? (
                   <ul className="divide-y">
                    {studyGroups.map(g => (
                      <li key={g.id} className="py-2">
                        <Link href={`/studygroups/${g.id}`} className="font-medium hover:underline">{g.name}</Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">You haven't joined any groups yet.</p>
                )
              }
              <div className="flex gap-2 pt-4">
                  <Button asChild size="sm" variant="secondary">
                  <Link href="/studygroups">Explore Groups</Link>
                  </Button>
                   <Button size="sm" onClick={() => setIsGroupModalOpen(true)}>
                    Join a Group
                  </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Group Projects</CardTitle>
              <CardDescription>Projects you have created or joined to build applications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isGroupProjectsLoading ? <div className="h-10 w-full bg-muted rounded animate-pulse"></div> : 
                (groupProjects && groupProjects.length > 0) ? (
                  <ul className="divide-y">
                    {groupProjects.map(c => (
                       <li key={c.id} className="py-2">
                        <Link href={`/groupprojects/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">You haven't joined any group projects yet.</p>
                )
              }
               <div className="flex gap-2 pt-4">
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/groupprojects">Explore Projects</Link>
                  </Button>
                   <Button size="sm" onClick={() => setIsCohortModalOpen(true)}>
                    Join a Project
                  </Button>
              </div>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>Your Book Clubs</CardTitle>
              <CardDescription>Book clubs you have created or joined.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isBookClubsLoading ? <div className="h-10 w-full bg-muted rounded animate-pulse"></div> : 
                (bookClubs && bookClubs.length > 0) ? (
                  <ul className="divide-y">
                    {bookClubs.map(c => (
                       <li key={c.id} className="py-2">
                        <Link href={`/book-clubs/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">You haven't joined any book clubs yet.</p>
                )
              }
               <div className="flex gap-2 pt-4">
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/book-clubs">Explore Clubs</Link>
                  </Button>
                   <Button size="sm" onClick={() => setIsBookClubModalOpen(true)}>
                    Join a Club
                  </Button>
              </div>
            </CardContent>
          </Card>

        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Your Meetups</CardTitle>
                <CardDescription>Events you have organized or are attending.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Tabs defaultValue="joined" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="joined">Joined Meetups</TabsTrigger>
                        <TabsTrigger value="created">Created Meetups</TabsTrigger>
                    </TabsList>
                    <TabsContent value="joined" className="pt-4">
                        {isLoadingJoinedMeetups ? <div className="h-10 w-full bg-muted rounded animate-pulse"></div> : 
                            (joinedMeetups && joinedMeetups.length > 0) ? (
                            <ul className="divide-y">
                                {joinedMeetups.map(p => (
                                <li key={p.id} className="py-2">
                                    <Link href={`/meetups/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                                </li>
                                ))}
                            </ul>
                            ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">You haven't joined any meetups. <Link href="/meetups" className="underline font-medium">Find one!</Link></p>
                            )
                        }
                    </TabsContent>
                    <TabsContent value="created" className="pt-4">
                         {isLoadingCreatedMeetups ? <div className="h-10 w-full bg-muted rounded animate-pulse"></div> : 
                            (createdMeetups && createdMeetups.length > 0) ? (
                            <ul className="divide-y">
                                {createdMeetups.map(p => (
                                <li key={p.id} className="py-2">
                                     <Link href={`/meetups/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                                </li>
                                ))}
                            </ul>
                            ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">You haven't created any meetups yet.</p>
                            )
                        }
                    </TabsContent>
                </Tabs>
                <div className="flex gap-2 pt-4">
                    <Button asChild size="sm" variant="secondary">
                        <Link href="/meetups">Explore Meetups</Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link href="/meetups/create">Create a Meetup</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Your Projects</CardTitle>
                <CardDescription>Individual projects you have showcased or starred.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Tabs defaultValue="my-projects" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="my-projects">Your Solo Projects</TabsTrigger>
                        <TabsTrigger value="starred-projects">
                            <Star className="mr-2 h-4 w-4" />
                            Starred Projects
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="my-projects" className="pt-4">
                        {isSoloProjectsLoading ? <div className="h-10 w-full bg-muted rounded animate-pulse"></div> : 
                            (soloProjects && soloProjects.length > 0) ? (
                            <ul className="divide-y">
                                {soloProjects.map(p => (
                                <li key={p.id} className="py-2 space-y-1">
                                    <Link href={p.projectUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">{p.name}</Link>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                                </li>
                                ))}
                            </ul>
                            ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">You haven't added any solo projects yet.</p>
                            )
                        }
                        <div className="flex gap-2 pt-4">
                             <Button asChild size="sm" variant="secondary">
                                <Link href="/solo-projects">Explore Solo Projects</Link>
                            </Button>
                            <Button size="sm" onClick={() => setIsSoloProjectModalOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Solo Project
                            </Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="starred-projects" className="pt-4">
                         {isStarredProjectsLoading ? <div className="h-10 w-full bg-muted rounded animate-pulse"></div> : 
                            (starredProjects && starredProjects.length > 0) ? (
                            <ul className="divide-y">
                                {starredProjects.map(p => (
                                <li key={p.id} className="py-2 space-y-1">
                                    <Link href={p.projectUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">{p.name}</Link>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                                </li>
                                ))}
                            </ul>
                            ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">You haven't starred any projects yet. <Link href="/solo-projects" className="underline font-medium">Go explore!</Link></p>
                            )
                        }
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

        <MentorshipManagement user={user} userProfile={userProfile} />
        <TutorshipManagement user={user} userProfile={userProfile} />
        <PairingManagement user={user} userProfile={userProfile} />

      </div>
    </div>
  );
}
