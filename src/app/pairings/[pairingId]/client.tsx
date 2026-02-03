'use client';

import { useDoc } from '@/firebase/firestore/use-doc';
import { useMemo } from 'react';
import { doc, DocumentReference } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Pairing, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, ArrowLeft, GitBranch } from 'lucide-react';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/utils';
import TaskList from '@/components/TaskList';
import CheckInSystem from '@/components/CheckInSystem';

function PartnerProfile({ userId }: { userId: string }) {
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
                    <CardTitle className="flex items-center gap-2"><GitBranch /> Your Partner</CardTitle>
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
                    <GitBranch /> Your Partner
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

export default function PairingDashboardPage({ params }: { params: { pairingId: string } }) {
  const { pairingId } = params;
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const pairingDocRef = useMemo(() => {
    if (!pairingId) return null;
    return doc(firestore, 'pairings', pairingId) as DocumentReference<Pairing>;
  }, [pairingId, firestore]);

  const { data: pairing, isLoading: isPairingLoading, error: pairingError } = useDoc<Pairing>(pairingDocRef);

  const partnerId = useMemo(() => {
      if (!user || !pairing) return null;
      return pairing.memberIds.find(id => id !== user.uid);
  }, [user, pairing]);

  const partnerDocRef = useMemo(() => {
    if (!partnerId) return null;
    return doc(firestore, 'users', partnerId) as DocumentReference<UserProfile>;
  }, [partnerId, firestore]);

  const { data: partnerProfile, isLoading: isPartnerLoading } = useDoc<UserProfile>(partnerDocRef);

  if (isPairingLoading || isUserLoading || isPartnerLoading) {
    return <div className="text-center py-10 p-4 md:p-10">Loading pairing dashboard...</div>;
  }
  
  if (!user) {
      return <div className="text-center py-10 p-4 md:p-10">Please log in to view this page.</div>;
  }

  if (pairingError) {
      return <div className="text-center py-10 text-destructive p-4 md:p-10">Error loading pairing data.</div>
  }

  if (!pairing) {
    return <div className="text-center py-10 p-4 md:p-10">Pairing not found.</div>;
  }
  
  if (!pairing.memberIds.includes(user.uid)) {
       return <div className="text-center py-10 text-destructive p-4 md:p-10">You do not have permission to view this page.</div>
  }

  if (!partnerProfile) {
    return <div className="text-center py-10 p-4 md:p-10">Loading partner information...</div>
  }

  const pageTitle = `Pairing with ${partnerProfile.username}`;
  const pageDescription = `This is your shared dashboard for pair programming.`;

  return (
    <div className="space-y-8 p-4 md:p-10">
        <Link href="/pair-programming" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pair Programming
        </Link>
      
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">{pageTitle}</CardTitle>
                <CardDescription>{pageDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Paired on {formatTimestamp(pairing.createdAt as any)}
                </div>
            </CardContent>
        </Card>
        
        {partnerId && <PartnerProfile userId={partnerId} />}

        <TaskList 
            groupOrCohortId={pairingId}
            collectionPath="pairings"
            memberIds={pairing.memberIds}
        />

        <CheckInSystem
            groupOrCohortId={pairingId}
            collectionPath="pairings"
            memberIds={pairing.memberIds}
        />
    </div>
  );
}
