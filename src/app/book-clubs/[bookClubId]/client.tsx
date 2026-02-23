'use client';

import { useDoc, useFirestore, useUser } from '@/firebase';
import { useMemo, useState, useEffect } from 'react';
import { doc, DocumentReference, collection, query, where, Query, getDocs, documentId, updateDoc } from 'firebase/firestore';
import { BookClub, UserProfile, UserStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, CalendarDays, ArrowLeft, MoreVertical, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatTimestamp, convertUTCToLocal } from '@/lib/utils';
import { ONE_WEEK_IN_MS } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import TaskList from '@/components/TaskList';
import CheckInSystem from '@/components/CheckInSystem';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import MemberList from '@/components/MemberList';


export default function BookClubDashboardPage({ params }: { params: { bookClubId: string } }) {
  const { bookClubId } = params;
  const { user } = useUser();
  const firestore = useFirestore();

  const clubDocRef = useMemo(() => {
    if (!bookClubId) return null;
    return doc(firestore, 'bookClubs', bookClubId) as DocumentReference<BookClub>;
  }, [bookClubId, firestore]);

  const userDocRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
  }, [user, firestore]);

  const { data: club, isLoading: isClubLoading, error: clubError } = useDoc<BookClub>(clubDocRef);
  const { data: currentUserProfile } = useDoc<UserProfile>(userDocRef);


  if (isClubLoading) {
    return <div className="text-center py-10 p-4 md:p-10">Loading club dashboard...</div>;
  }
  
  if (clubError) {
      return <div className="text-center py-10 text-destructive p-4 md:p-10">Error loading club data.</div>
  }

  if (!club) {
    return <div className="text-center py-10 p-4 md:p-10">Book club not found.</div>;
  }

  const isNew = club.createdAt && (Date.now() - (club.createdAt as any).toMillis()) < ONE_WEEK_IN_MS;

  return (
    <div className="space-y-8 p-4 md:p-10">
        <Link href="/book-clubs" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Book Clubs
        </Link>
      
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className='space-y-2'>
                <div className="flex flex-wrap items-center gap-4">
                    <CardTitle className="font-headline text-3xl">{club.name}</CardTitle>
                     {isNew ? (
                        <Badge>New</Badge>
                    ) : (
                        <Badge variant="secondary">In Progress</Badge>
                    )}
                </div>
                <CardDescription>{club.description}</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="flex flex-wrap gap-4 items-center">
             <Badge variant="secondary" className="text-base">{club.topic}</Badge>
             {club.commitmentHours && (
                <Badge variant="outline" className="text-base">
                    {club.commitmentHours}hr/day
                    {club.commitmentDays && club.commitmentDays.length > 0 ? ` on ${club.commitmentDays.join(', ')}` : ''}
                </Badge>
            )}
            {club.startTimeUTC && (
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full text-sm font-semibold border border-primary/20">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>
                        {currentUserProfile 
                            ? convertUTCToLocal(club.startTimeUTC, currentUserProfile.utcOffset)
                            : `${club.startTimeUTC} UTC`
                        }
                    </span>
                </div>
             )}
           </div>
           <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4 mr-2" />
                Created on {formatTimestamp(club.createdAt as any)}
           </div>
        </CardContent>
      </Card>

      <TaskList 
        groupOrCohortId={bookClubId}
        collectionPath="bookClubs"
        memberIds={club.memberIds}
      />

      <CheckInSystem
        groupOrCohortId={bookClubId}
        collectionPath="bookClubs"
        memberIds={club.memberIds}
      />

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Members ({club.memberIds.length})
            </CardTitle>
        </CardHeader>
        <CardContent>
            <MemberList memberIds={club.memberIds} />
        </CardContent>
      </Card>

    </div>
  );
}