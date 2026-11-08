'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, type DocumentReference } from 'firebase/firestore';
import { CheckSquare } from 'lucide-react';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ActivityFeed from '@/components/ActivityFeed';
import GettingStarted from '@/components/account/GettingStarted';
import { MatchingDashboard } from '@/components/MatchingProgram';
import AccountPageSkeleton from '@/components/account/AccountPageSkeleton';
import GroupListCard from '@/components/account/GroupListCard';
import MeetupsCard from '@/components/account/MeetupsCard';
import ProjectsCard from '@/components/account/ProjectsCard';
import PairingDashboard from '@/components/PairingDashboard';
import { MENTORSHIP, TUTORING } from '@/lib/matching-programs';
import type { UserProfile } from '@/lib/types';

export default function AccountPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

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

  if (!isUserLoading && !user) {
    return <div className="p-4 md:p-10">Redirecting to login...</div>;
  }

  if (isUserLoading || isProfileLoading || !user || !userProfile) {
    return (
      <div className="p-4 md:p-10">
        <AccountPageSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <Avatar className="h-24 w-24 flex-shrink-0">
            <AvatarImage src={userProfile.profilePictureUrl || user.photoURL || ''} alt={userProfile.username || ''} />
            <AvatarFallback className="text-3xl">{userProfile.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-headline">Hello, {userProfile.username || user.email}!</h1>
        </div>

        <GettingStarted user={user} profile={userProfile} />

        <ActivityFeed uid={user.uid} />

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
          <GroupListCard kind="studyGroup" uid={user.uid} />
          <GroupListCard kind="groupProject" uid={user.uid} />
          <GroupListCard kind="bookClub" uid={user.uid} />
        </div>

        <MeetupsCard userProfile={userProfile} />
        <ProjectsCard user={user} userProfile={userProfile} />

        <MatchingDashboard config={MENTORSHIP} user={user} userProfile={userProfile} title="Mentorship">
          <Button asChild variant="secondary" className="w-full">
            <Link href="/mentorship">Explore Mentorship Program</Link>
          </Button>
        </MatchingDashboard>
        <MatchingDashboard config={TUTORING} user={user} userProfile={userProfile} title="Tutorship">
          <Button asChild variant="secondary" className="w-full">
            <Link href="/tutor">Explore Tutoring Program</Link>
          </Button>
        </MatchingDashboard>
        <PairingDashboard user={user} userProfile={userProfile} title="Pair Programming">
          <Button asChild variant="secondary" className="w-full">
            <Link href="/pair-programming">Explore Pair Programming</Link>
          </Button>
        </PairingDashboard>
      </div>
    </div>
  );
}
