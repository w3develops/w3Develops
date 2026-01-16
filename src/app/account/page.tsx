
'use client';

import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { useMemo, useEffect, useState } from 'react';
import { doc, DocumentReference, collection, query, where, Query, documentId } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserProfile, StudyGroup, GroupProject, SoloProject } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Github, Linkedin, Twitter, PlusCircle } from 'lucide-react';
import { JoinCohortModal } from '@/components/modals/JoinCohortModal';
import { JoinGroupModal } from '@/components/modals/JoinGroupModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SubmitSoloProjectForm from '@/components/forms/SubmitSoloProjectForm';

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
       <div className="grid gap-6 md:grid-cols-2">
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

export default function AccountPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
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


  if (isUserLoading || isProfileLoading || !userProfile) {
    return (
      <div className="p-4 md:p-10">
        <AccountPageSkeleton />
      </div>
    );
  }

  if (!user) {
    // This part should ideally not be reached due to the useEffect above, but it's a good safeguard.
    return <div className="p-4 md:p-10">Redirecting to login...</div>;
  }
  
  return (
    <div className="p-4 md:p-10">
      <JoinCohortModal isOpen={isCohortModalOpen} onClose={() => setIsCohortModalOpen(false)} />
      <JoinGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />

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
        
        <div className="grid gap-6 md:grid-cols-2">
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
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Your Solo Projects</CardTitle>
                <CardDescription>Individual projects you have showcased.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    <p className="text-sm text-muted-foreground">You haven't added any solo projects yet.</p>
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
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
