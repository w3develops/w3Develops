
'use client';

import { useDoc, useFirestore, useUser } from '@/firebase';
import { useEffect, useState, useMemo } from 'react';
import { doc, DocumentReference, collection, query, where, getDocs, Query, documentId, updateDoc } from 'firebase/firestore';
import { GroupProject, UserProfile, UserStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Github, Users, CalendarDays, ArrowLeft, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/utils';
import { ONE_WEEK_IN_MS } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import TaskList from '@/components/TaskList';
import CheckInSystem from '@/components/CheckInSystem';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const statusColors: Record<UserStatus, string> = {
  active: 'bg-green-500',
  paused: 'bg-red-500',
  inactive: 'bg-gray-500',
};


function MemberList({ memberIds }: { memberIds: string[] }) {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const { toast } = useToast();
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            if (!memberIds || memberIds.length === 0) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const membersQuery = query(collection(firestore, 'users'), where(documentId(), 'in', memberIds.slice(0, 30)));
                const snapshot = await getDocs(membersQuery);
                const memberData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
                setMembers(memberData);
            } catch (error) {
                console.error("Error fetching members: ", error);
                toast({
                  variant: 'destructive',
                  title: 'Error fetching members',
                  description: 'Could not load project members. Please try again later.'
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchMembers();
    }, [firestore, memberIds, toast]);

    const handleStatusChange = async (memberId: string, status: UserStatus) => {
        if (currentUser?.uid !== memberId) {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'You can only change your own status.' });
            return;
        }

        const userDocRef = doc(firestore, 'users', memberId);
        try {
            await updateDoc(userDocRef, { status });
            setMembers(prevMembers => prevMembers.map(m => m.id === memberId ? { ...m, status } : m));
            toast({ title: 'Status Updated', description: `Your status is now ${status}.`});
        } catch (error: any) {
            console.error("Error updating status:", error);
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
    };
    
    const getDerivedStatus = (member: UserProfile): UserStatus => {
        if (!member.lastCheckInAt) {
            return member.status || 'inactive';
        }
        const lastCheckInTime = (member.lastCheckInAt as any).toMillis();
        const oneWeekAgo = Date.now() - ONE_WEEK_IN_MS;
        const twoWeeksAgo = Date.now() - 2 * ONE_WEEK_IN_MS;

        if (lastCheckInTime < twoWeeksAgo) return 'inactive';
        if (lastCheckInTime < oneWeekAgo) return 'paused';
        return member.status || 'active';
    }


    if (isLoading) {
        return <p>Loading members...</p>;
    }
    
    if (!members || members.length === 0) {
        return <p className="text-muted-foreground text-sm">This project doesn't have any members yet.</p>;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {members.map(member => {
                const derivedStatus = getDerivedStatus(member);
                return (
                 <div key={member.id} className="flex flex-col items-center text-center gap-2 p-2 rounded-lg hover:bg-accent relative">
                     <Link href={`/users/${member.id}`} className="w-full">
                        <Avatar className="mx-auto">
                            <AvatarImage src={member.profilePictureUrl} />
                            <AvatarFallback>{member.username?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium truncate w-full mt-2">{member.username}</p>
                    </Link>

                    <div className="flex items-center gap-2 text-xs capitalize">
                        <span className={cn("h-2 w-2 rounded-full", statusColors[derivedStatus])}></span>
                        {derivedStatus}
                    </div>

                    {currentUser?.uid === member.id && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="absolute top-0 right-0 h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'active')}>Set Active</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'paused')}>Set Paused</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'inactive')}>Set Inactive</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            )})}
        </div>
    );
}


export default function GroupProjectDashboardPage({ params }: { params: { groupProjectId: string } }) {
  const { groupProjectId } = params;
  const firestore = useFirestore();
  
  const groupProjectDocRef = useMemo(() => {
    if (!groupProjectId) return null;
    return doc(firestore, 'groupProjects', groupProjectId) as DocumentReference<GroupProject>;
  }, [groupProjectId, firestore]);

  const { data: groupProject, isLoading: isGroupProjectLoading, error: groupProjectError } = useDoc<GroupProject>(groupProjectDocRef);

  if (isGroupProjectLoading) {
    return <div className="text-center py-10 p-4 md:p-10">Loading project dashboard...</div>;
  }
  
  if (groupProjectError) {
      return <div className="text-center py-10 text-destructive p-4 md:p-10">Error loading project data.</div>
  }

  if (!groupProject) {
    return <div className="text-center py-10 p-4 md:p-10">Group project not found.</div>;
  }

  const isNew = groupProject.createdAt && (Date.now() - (groupProject.createdAt as any).toMillis()) < ONE_WEEK_IN_MS;

  return (
    <div className="space-y-8 p-4 md:p-10">
        <Link href="/groupprojects" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Group Projects
        </Link>
      
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-4">
                    <CardTitle className="font-headline text-3xl">{groupProject.name}</CardTitle>
                    {isNew ? (
                        <Badge>New</Badge>
                    ) : (
                        <Badge variant="secondary">In Progress</Badge>
                    )}
                </div>
                <CardDescription>{groupProject.description}</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="flex flex-wrap gap-4 items-center">
             <Badge variant="secondary" className="text-base">{groupProject.topic}</Badge>
             <Badge variant="outline" className="text-base">{groupProject.commitment}</Badge>
             {groupProject.commitmentDays && groupProject.commitmentDays.length > 0 && (
                <Badge variant="outline" className="text-base">
                    {groupProject.commitmentDays.join(', ')}
                </Badge>
            )}
              {groupProject.githubUrl && (
                <a href={groupProject.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <Github className="w-5 h-5" /> GitHub Repository
                </a>
             )}
           </div>
           <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4 mr-2" />
                Created on {formatTimestamp(groupProject.createdAt as any)}
           </div>
        </CardContent>
      </Card>
      
      <TaskList 
        groupOrCohortId={groupProjectId}
        collectionPath="groupProjects"
        memberIds={groupProject.memberIds}
      />

      <CheckInSystem
        groupOrCohortId={groupProjectId}
        collectionPath="groupProjects"
        memberIds={groupProject.memberIds}
      />

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Members ({groupProject.memberIds.length})
            </CardTitle>
        </CardHeader>
        <CardContent>
            <MemberList memberIds={groupProject.memberIds} />
        </CardContent>
      </Card>

    </div>
  );
}
