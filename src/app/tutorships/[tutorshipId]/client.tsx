
'use client';

import { useDoc, useFirestore, useUser } from '@/firebase';
import { useMemo } from 'react';
import { doc, DocumentReference } from 'firebase/firestore';
import { Tutorship, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, ArrowLeft, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/utils';
import TaskList from '@/components/TaskList';
import CheckInSystem from '@/components/CheckInSystem';
import SharedNoteEditor from '@/components/SharedNoteEditor';

function PartnerProfile({ userId, role }: { userId: string, role: 'Tutor' | 'Student' }) {
    const firestore = useFirestore();

    const profileDocRef = useMemo(() => {
        if (!userId) return null;
        return doc(firestore, 'users', userId) as DocumentReference<UserProfile>;
    }, [userId, firestore]);

    const { data: profile, isLoading } = useDoc<UserProfile>(profileDocRef);

    if (isLoading) {
        return (
             <Card className="animate-pulse">
                <CardHeader><div className="h-6 w-32 bg-muted rounded"></div></CardHeader>
                <CardContent className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted"></div>
                    <div className="space-y-2">
                        <div className="h-6 w-40 bg-muted rounded"></div>
                        <div className="h-4 w-64 bg-muted rounded"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    if (!profile) {
         return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><GraduationCap /> Your {role}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Could not load your partner's profile.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <GraduationCap /> Your {role}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Link href={`/users/${profile.id}`} className="flex items-center gap-4 group">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={profile.profilePictureUrl} />
                        <AvatarFallback className="text-2xl">{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-xl font-bold group-hover:underline">{profile.username}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
                    </div>
                </Link>
            </CardContent>
        </Card>
    );
}

export default function TutorshipDashboardPage({ params }: { params: { tutorshipId: string } }) {
  const { tutorshipId } = params;
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const tutorshipDocRef = useMemo(() => {
    if (!tutorshipId) return null;
    return doc(firestore, 'tutorships', tutorshipId) as DocumentReference<Tutorship>;
  }, [tutorshipId, firestore]);

  const { data: tutorship, isLoading: isTutorshipLoading, error: tutorshipError } = useDoc<Tutorship>(tutorshipDocRef);

  const partnerId = useMemo(() => {
      if (!user || !tutorship) return null;
      return tutorship.memberIds.find(id => id !== user.uid);
  }, [user, tutorship]);

  const partnerDocRef = useMemo(() => {
    if (!partnerId) return null;
    return doc(firestore, 'users', partnerId) as DocumentReference<UserProfile>;
  }, [partnerId, firestore]);

  const { data: partnerProfile, isLoading: isPartnerLoading } = useDoc<UserProfile>(partnerDocRef);

  if (isTutorshipLoading || isUserLoading || isPartnerLoading) {
    return <div className="text-center py-10 p-4 md:p-10">Loading tutorship dashboard...</div>;
  }
  
  if (!user) {
      return <div className="text-center py-10 p-4 md:p-10">Please log in to view this page.</div>;
  }

  if (tutorshipError) {
      return <div className="text-center py-10 text-destructive p-4 md:p-10">Error loading tutorship data.</div>
  }

  if (!tutorship) {
    return <div className="text-center py-10 p-4 md:p-10">Tutorship not found.</div>;
  }
  
  if (!tutorship.memberIds.includes(user.uid)) {
       return <div className="text-center py-10 text-destructive p-4 md:p-10">You do not have permission to view this page.</div>
  }

  if (!partnerProfile) {
    return <div className="text-center py-10 p-4 md:p-10">Loading partner information...</div>
  }

  const isCurrentUserTutor = user.uid === tutorship.tutorId;
  const partnerRole: "Tutor" | "Student" = isCurrentUserTutor ? 'Student' : 'Tutor';
  const userRole: "Tutor" | "Student" = isCurrentUserTutor ? 'Tutor' : 'Student';
  const pageTitle = `Tutorship with ${partnerProfile.username}`;
  const pageDescription = `This is your shared dashboard. You are the ${userRole}.`;

  return (
    <div className="space-y-8 p-4 md:p-10">
        <Link href="/tutor" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tutoring
        </Link>
      
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">{pageTitle}</CardTitle>
                <CardDescription>{pageDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Started on {formatTimestamp(tutorship.createdAt as any)}
                </div>
            </CardContent>
        </Card>
        
        {partnerId && partnerRole && <PartnerProfile userId={partnerId} role={partnerRole} />}

        <Card>
            <CardContent className="p-6">
                <SharedNoteEditor collectionPath="tutorships" sessionId={tutorshipId} />
            </CardContent>
        </Card>

        <TaskList 
            groupOrCohortId={tutorshipId}
            collectionPath="tutorships"
            memberIds={tutorship.memberIds}
        />

        <CheckInSystem
            groupOrCohortId={tutorshipId}
            collectionPath="tutorships"
            memberIds={tutorship.memberIds}
        />
    </div>
  );
}
