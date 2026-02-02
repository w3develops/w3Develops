'use client';

import { useCollection, useFirestore, useUser } from '@/firebase';
import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, DocumentReference, collection, query, where, Query, documentId, getDocs } from 'firebase/firestore';
import { UserProfile, StudyGroup, GroupProject, SoloProject } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Github, Linkedin, Twitter, BrainCircuit, Users, Lock, UserCheck, UserPlus, CalendarDays, ExternalLink, GraduationCap } from 'lucide-react';
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
import { formatTimestamp } from '@/lib/utils';

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
    <div className="space-y-8 animate-pulse">
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="rounded-full bg-muted h-32 w-32 flex-shrink-0"></div>
          <div className="flex-1 space-y-3 text-center md:text-left w-full">
            <div className="h-8 bg-muted rounded w-48 mx-auto md:mx-0"></div>
            <div className="h-4 bg-muted rounded w-32 mx-auto md:mx-0"></div>
            <div className="h-4 bg-muted rounded w-full max-w-lg mx-auto md:mx-0"></div>
            <div className="h-4 bg-muted rounded w-full max-w-md mx-auto md:mx-0"></div>
            <div className="flex justify-center md:justify-start items-center gap-4 pt-2">
              <div className="h-6 w-6 bg-muted rounded"></div>
              <div className="h-6 w-6 bg-muted rounded"></div>
              <div className="h-6 w-6 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><div className="h-6 w-32 bg-muted rounded"></div></CardHeader>
        <CardContent><div className="h-10 w-full bg-muted rounded"></div></CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><div className="h-6 w-32 bg-muted rounded"></div></CardHeader>
          <CardContent><div className="h-10 w-full bg-muted rounded"></div></CardContent>
        </Card>
        <Card>
          <CardHeader><div className="h-6 w-32 bg-muted rounded"></div></CardHeader>
          <CardContent><div className="h-10 w-full bg-muted rounded"></div></CardContent>
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
                <div className="text-center hover:bg-accent p-2 rounded-md cursor-pointer">
                    <p className="font-semibold text-lg">{userIds.length}</p>
                    <p className="text-sm text-muted-foreground">{title}</p>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                 <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>A list of users who are {title.toLowerCase()}.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {isLoading && <p>Loading...</p>}
                    {!isLoading && profiles.length === 0 && <p className="text-muted-foreground">No users to display.</p>}
                    {profiles.map(profile => (
                        <Link href={`/users/${profile.id}`} key={profile.id} className="flex items-center gap-4 hover:bg-accent p-2 rounded-md">
                           <Avatar className="h-10 w-10">
                                <AvatarImage src={profile.profilePictureUrl || ''} />
                                <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{profile.username}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">{profile.bio}</p>
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

  const userGroupProjectsQuery = useMemo(() => {
    if (!userId) return null;
    return query(collection(firestore, 'groupProjects'), where('memberIds', 'array-contains', userId)) as Query;
  }, [userId, firestore]);

  const { data: groupProjects, isLoading: isGroupProjectsLoading } = useCollection<GroupProject>(userGroupProjectsQuery);

  const userGroupsQuery = useMemo(() => {
    if (!userId) return null;
    return query(collection(firestore, 'studyGroups'), where('memberIds', 'array-contains', userId)) as Query;
  }, [userId, firestore]);

  const { data: studyGroups, isLoading: isGroupsLoading } = useCollection<StudyGroup>(userGroupsQuery);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="mr-2" />Study Groups</CardTitle>
        </CardHeader>
        <CardContent>
            {isGroupsLoading ? <div className="h-10 w-full bg-muted rounded animate-pulse"></div> :
            studyGroups && studyGroups.length > 0 ? (
              <ul className="space-y-2">
                {studyGroups.map(g => (
                  <li key={g.id}>
                    <Link href={`/studygroups/${g.id}`} className="font-medium p-2 rounded-md hover:bg-accent flex justify-between items-center">
                      <span>{g.name}</span>
                      <Badge variant="secondary">{g.topic}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Not a member of any groups yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="mr-2" />Group Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {isGroupProjectsLoading ? <div className="h-10 w-full bg-muted rounded animate-pulse"></div> :
            groupProjects && groupProjects.length > 0 ? (
              <ul className="space-y-2">
                {groupProjects.map(c => (
                  <li key={c.id}>
                    <Link href={`/groupprojects/${c.id}`} className="font-medium p-2 rounded-md hover:bg-accent flex justify-between items-center">
                      <span>{c.name}</span>
                      <Badge variant="secondary">{c.topic}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Not a member of any projects yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function UserSoloProjects({ soloProjectIds }: { soloProjectIds: string[] | undefined }) {
  const firestore = useFirestore();

  const soloProjectsQuery = useMemo(() => {
    if (!soloProjectIds || soloProjectIds.length === 0) return null;
    return query(
      collection(firestore, 'soloProjects'),
      where(documentId(), 'in', soloProjectIds.slice(0, 30))
    ) as Query<SoloProject>;
  }, [firestore, soloProjectIds]);

  const { data: soloProjects, isLoading } = useCollection<SoloProject>(soloProjectsQuery);

  if (!soloProjectIds || soloProjectIds.length === 0) {
    // Don't render the card if the user has never submitted a project.
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solo Projects</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
        ) : soloProjects && soloProjects.length > 0 ? (
          <ul className="space-y-2">
            {soloProjects.map(project => (
              <li key={project.id}>
                <a
                  href={ensureAbsoluteUrl(project.projectUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium p-3 rounded-md hover:bg-accent flex justify-between items-center border"
                >
                  <div className="flex-1 mr-4">
                    <p className="font-semibold">{project.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  </div>
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No solo projects showcased yet.</p>
        )}
      </CardContent>
    </Card>
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
  
  const mentorshipBadge = useMemo(() => {
    if (!userProfile) return null;
    if (userProfile.mentorshipRole === 'mentor') return <Badge variant="secondary" className="gap-2"><GraduationCap className="h-4 w-4"/>Mentor</Badge>;
    if (userProfile.mentorshipRole === 'mentee') return <Badge variant="secondary" className="gap-2"><GraduationCap className="h-4 w-4"/>Mentee</Badge>;
    if (userProfile.mentorshipRole === 'both') return <Badge variant="secondary" className="gap-2"><GraduationCap className="h-4 w-4"/>Mentor & Mentee</Badge>;
    return null;
  }, [userProfile]);

  if (isProfileLoading) {
    return (
        <div className="p-4 md:p-10">
            <ProfilePageSkeleton />
        </div>
    );
  }

  if (!userProfile) {
    return <div className="text-center py-10 p-4 md:p-10">User not found.</div>;
  }
  
  const showFollowInfo = isOwner || !userProfile.followInfoPrivate;

  return (
    <div className="space-y-8 p-4 md:p-10">
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-32 w-32 border-4 border-primary flex-shrink-0">
            <AvatarImage src={userProfile.profilePictureUrl || ''} alt={userProfile.username} />
            <AvatarFallback className="text-5xl">{userProfile.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4">
              <h1 className="text-3xl font-headline">{userProfile.username}</h1>
              {mentorshipBadge}
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground mt-2">
              <CalendarDays className="h-4 w-4" />
              <span>Joined on {formatTimestamp(userProfile.createdAt)}</span>
            </div>
            <p className="text-muted-foreground mt-2 max-w-2xl">{userProfile.bio}</p>
            <div className="flex justify-center md:justify-start items-center gap-4 mt-4">
              {userProfile.socialLinks?.github && (
                <a href={ensureAbsoluteUrl(userProfile.socialLinks.github)} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  <Github className="w-6 h-6" />
                </a>
              )}
              {userProfile.socialLinks?.linkedin && (
                <a href={ensureAbsoluteUrl(userProfile.socialLinks.linkedin)} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  <Linkedin className="w-6 h-6" />
                </a>
              )}
              {userProfile.socialLinks?.twitter && (
                <a href={ensureAbsoluteUrl(userProfile.socialLinks.twitter)} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  <Twitter className="w-6 h-6" />
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 self-center md:self-start">
             <FollowButton targetUserId={userProfile.id} targetUserFollowers={userProfile.followers || []} />
          </div>
        </CardContent>
        <CardHeader className="border-t">
          <div className="flex justify-around">
            {showFollowInfo ? (
              <>
                 <UserFollowList title="Followers" userIds={userProfile.followers || []} />
                 <UserFollowList title="Following" userIds={userProfile.following || []} />
              </>
            ) : (
              <div className="text-center text-muted-foreground p-4 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>This user's follow info is private.</span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><BrainCircuit className="w-5 h-5" /> Mentoring Skills</CardTitle>
            </CardHeader>
            <CardContent>
            {userProfile.mentoringSkills && userProfile.mentoringSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                {userProfile.mentoringSkills.map(skill => <Badge key={skill}>{skill}</Badge>)}
                </div>
            ) : <p className="text-sm text-muted-foreground">No mentoring skills listed yet.</p>}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><BrainCircuit className="w-5 h-5" /> Seeking Skills</CardTitle>
            </CardHeader>
            <CardContent>
            {userProfile.seekingSkills && userProfile.seekingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                {userProfile.seekingSkills.map(skill => <Badge key={skill}>{skill}</Badge>)}
                </div>
            ) : <p className="text-sm text-muted-foreground">No skills being sought yet.</p>}
            </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BrainCircuit className="mr-2" />Skills</CardTitle>
        </CardHeader>
        <CardContent>
            {userProfile.skills && userProfile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userProfile.skills.map(skill => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No skills have been added yet.</p>}
        </CardContent>
      </Card>
      
      {userId && <UserActivity userId={userId} />}
      
      <UserSoloProjects soloProjectIds={userProfile.soloProjectIds} />

    </div>
  );
}
