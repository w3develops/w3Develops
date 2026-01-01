
'use client';

import { useCollection, useFirestore, useUser } from '@/firebase';
import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, DocumentReference, collection, query, where, Query, documentId, getDocs } from 'firebase/firestore';
import { UserProfile, StudyGroup, Cohort } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Github, Linkedin, Twitter, BrainCircuit, Users, Lock, UserCheck, UserPlus } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import FollowButton from '@/components/FollowButton';

// Helper function to ensure a URL is absolute
const ensureAbsoluteUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

function ProfilePageSkeleton() {
  return (
    <div class="space-y-8 animate-pulse">
      <Card>
        <CardContent class="p-6 flex flex-col md:flex-row items-center gap-6">
          <div class="rounded-full bg-muted h-32 w-32 flex-shrink-0"></div>
          <div class="flex-1 space-y-3 text-center md:text-left w-full">
            <div class="h-8 bg-muted rounded w-48 mx-auto md:mx-0"></div>
            <div class="h-4 bg-muted rounded w-full max-w-lg mx-auto md:mx-0"></div>
            <div class="h-4 bg-muted rounded w-full max-w-md mx-auto md:mx-0"></div>
            <div class="flex justify-center md:justify-start items-center gap-4 pt-2">
              <div class="h-6 w-6 bg-muted rounded"></div>
              <div class="h-6 w-6 bg-muted rounded"></div>
              <div class="h-6 w-6 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><div class="h-6 w-32 bg-muted rounded"></div></CardHeader>
        <CardContent><div class="h-10 w-full bg-muted rounded"></div></CardContent>
      </Card>
      <div class="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><div class="h-6 w-32 bg-muted rounded"></div></CardHeader>
          <CardContent><div class="h-10 w-full bg-muted rounded"></div></CardContent>
        </Card>
        <Card>
          <CardHeader><div class="h-6 w-32 bg-muted rounded"></div></CardHeader>
          <CardContent><div class="h-10 w-full bg-muted rounded"></div></CardContent>
        </Card>
      </div>
    </div>
  )
}

function UserFollowList({ title, userIds }: { title: string, userIds: string[] }) {
    const firestore = useFirestore();
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfiles = async () => {
            if (!userIds || userIds.length === 0) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const profilesQuery = query(collection(firestore, 'users'), where(documentId(), 'in', userIds.slice(0, 30)));
            const snapshot = await getDocs(profilesQuery);
            const profilesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
            setProfiles(profilesData);
            setIsLoading(false);
        };
        fetchProfiles();
    }, [firestore, userIds]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div class="text-center hover:bg-accent p-2 rounded-md cursor-pointer">
                    <p class="font-semibold text-lg">{userIds.length}</p>
                    <p class="text-sm text-muted-foreground">{title}</p>
                </div>
            </DialogTrigger>
            <DialogContent class="sm:max-w-[425px]">
                 <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>A list of users who are {title.toLowerCase()}.</DialogDescription>
                </DialogHeader>
                <div class="space-y-4 max-h-[60vh] overflow-y-auto">
                    {isLoading && <p>Loading...</p>}
                    {!isLoading && profiles.length === 0 && <p class="text-muted-foreground">No users to display.</p>}
                    {profiles.map(profile => (
                        <Link href={`/users/${profile.id}`} key={profile.id} class="flex items-center gap-4 hover:bg-accent p-2 rounded-md">
                           <Avatar class="h-10 w-10">
                                <AvatarImage src={profile.profilePictureUrl || ''} />
                                <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p class="font-semibold">{profile.username}</p>
                                <p class="text-sm text-muted-foreground line-clamp-1">{profile.bio}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function UserActivity({ userId }: { userId: string }) {
  const firestore = useFirestore();

  const userCohortsQuery = useMemo(() => {
    if (!userId) return null;
    return query(collection(firestore, 'cohorts'), where('memberIds', 'array-contains', userId)) as Query;
  }, [userId, firestore]);

  const { data: cohorts, isLoading: isCohortsLoading } = useCollection<Cohort>(userCohortsQuery);

  const userGroupsQuery = useMemo(() => {
    if (!userId) return null;
    return query(collection(firestore, 'studyGroups'), where('memberIds', 'array-contains', userId)) as Query;
  }, [userId, firestore]);

  const { data: studyGroups, isLoading: isGroupsLoading } = useCollection<StudyGroup>(userGroupsQuery);

  return (
    <div class="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2"><Users class="mr-2" />Group Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {isCohortsLoading ? <div class="h-10 w-full bg-muted rounded animate-pulse"></div> :
            cohorts && cohorts.length > 0 ? (
              <ul class="space-y-2">
                {cohorts.map(c => (
                  <li key={c.id}>
                    <Link href={`/cohorts/${c.id}`} class="font-medium p-2 rounded-md hover:bg-accent flex justify-between items-center">
                      <span>{c.name}</span>
                      <Badge variant="secondary">{c.topic}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p class="text-sm text-muted-foreground">Not a member of any cohorts yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2"><Users class="mr-2" />Study Groups</CardTitle>
        </CardHeader>
        <CardContent>
            {isGroupsLoading ? <div class="h-10 w-full bg-muted rounded animate-pulse"></div> :
            studyGroups && studyGroups.length > 0 ? (
              <ul class="space-y-2">
                {studyGroups.map(g => (
                  <li key={g.id}>
                    <Link href={`/studygroups/${g.id}`} class="font-medium p-2 rounded-md hover:bg-accent flex justify-between items-center">
                      <span>{g.name}</span>
                      <Badge variant="secondary">{g.topic}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p class="text-sm text-muted-foreground">Not a member of any groups yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}


export default function UserProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const { user: currentUser } = useUser();
  const firestore = useFirestore();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  
  const isOwner = currentUser?.uid === userId;

  useEffect(() => {
    if (!userId) return;

    const fetchUserProfile = async () => {
      setIsProfileLoading(true);
      const userDocRef = doc(firestore, 'users', userId) as DocumentReference<UserProfile>;
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        setUserProfile({ ...docSnap.data(), id: docSnap.id });
      } else {
        setUserProfile(null);
      }
      setIsProfileLoading(false);
    };

    fetchUserProfile();
  }, [userId, firestore]);
  
  if (isProfileLoading) {
    return (
        <div class="p-4 md:p-10">
            <ProfilePageSkeleton />
        </div>
    );
  }

  if (!userProfile) {
    return <div class="text-center py-10 p-4 md:p-10">User not found.</div>;
  }
  
  const showFollowInfo = isOwner || !userProfile.followInfoPrivate;

  return (
    <div class="space-y-8 p-4 md:p-10">
      <Card>
        <CardContent class="p-6 flex flex-col md:flex-row items-center gap-6">
          <Avatar class="h-32 w-32 border-4 border-primary flex-shrink-0">
            <AvatarImage src={userProfile.profilePictureUrl || ''} alt={userProfile.username} />
            <AvatarFallback class="text-5xl">{userProfile.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div class="flex-1 text-center md:text-left">
            <h1 class="text-3xl font-headline">{userProfile.username}</h1>
            <p class="text-muted-foreground mt-1 max-w-2xl">{userProfile.bio}</p>
            <div class="flex justify-center md:justify-start items-center gap-4 mt-4">
              {userProfile.socialLinks?.github && (
                <a href={ensureAbsoluteUrl(userProfile.socialLinks.github)} target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-foreground">
                  <Github class="w-6 h-6" />
                </a>
              )}
              {userProfile.socialLinks?.linkedin && (
                <a href={ensureAbsoluteUrl(userProfile.socialLinks.linkedin)} target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-foreground">
                  <Linkedin class="w-6 h-6" />
                </a>
              )}
              {userProfile.socialLinks?.twitter && (
                <a href={ensureAbsoluteUrl(userProfile.socialLinks.twitter)} target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-foreground">
                  <Twitter class="w-6 h-6" />
                </a>
              )}
            </div>
          </div>
          <div class="flex flex-col gap-2 self-center md:self-start">
             <FollowButton targetUserId={userProfile.id} targetUserFollowers={userProfile.followers || []} />
          </div>
        </CardContent>
        <CardHeader class="border-t">
          <div class="flex justify-around">
            {showFollowInfo ? (
              <>
                 <UserFollowList title="Followers" userIds={userProfile.followers || []} />
                 <UserFollowList title="Following" userIds={userProfile.following || []} />
              </>
            ) : (
              <div class="text-center text-muted-foreground p-4 flex items-center gap-2">
                <Lock class="w-4 h-4" />
                <span>This user's follow info is private.</span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-xl"><BrainCircuit class="w-5 h-5" /> Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {userProfile.skills && userProfile.skills.length > 0 ? (
            <div class="flex flex-wrap gap-2">
              {userProfile.skills.map(skill => <Badge key={skill}>{skill}</Badge>)}
            </div>
          ) : <p class="text-sm text-muted-foreground">No skills listed yet.</p>}
        </CardContent>
      </Card>
      
      {/* Only render UserActivity if we have a valid userId */}
      {userId && <UserActivity userId={userId} />}

    </div>
  );
}
