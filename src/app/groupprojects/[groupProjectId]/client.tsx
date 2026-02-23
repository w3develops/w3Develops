'use client';

import { useDoc, useFirestore, useUser } from '@/firebase';
import { useEffect, useState, useMemo } from 'react';
import { doc, DocumentReference, collection, query, where, getDocs, Query, documentId, updateDoc } from 'firebase/firestore';
import { GroupProject, UserProfile, UserStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Github, Users, CalendarDays, ArrowLeft, MoreVertical, Clock } from 'lucide-react';
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


export default function GroupProjectDashboardPage({ params }: { params: { groupProjectId: string } }) {
  const { groupProjectId } = params;
  const { user } = useUser();
  const firestore = useFirestore();
  
  const groupProjectDocRef = useMemo(() => {
    if (!groupProjectId) return null;
    return doc(firestore, 'groupProjects', groupProjectId) as DocumentReference<GroupProject>;
  }, [groupProjectId, firestore]);

  const userDocRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
  }, [user, firestore]);

  const { data: groupProject, isLoading: isGroupProjectLoading, error: groupProjectError } = useDoc<GroupProject>(groupProjectDocRef);
  const { data: currentUserProfile } = useDoc<UserProfile>(userDocRef);

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
             {groupProject.startTimeUTC && (
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full text-sm font-semibold border border-primary/20">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>
                        {currentUserProfile 
                            ? convertUTCToLocal(groupProject.startTimeUTC, currentUserProfile.utcOffset)
                            : `${groupProject.startTimeUTC} UTC`
                        }
                    </span>
                </div>
             )}
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