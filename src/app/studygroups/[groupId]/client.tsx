
'use client';

import { useDoc, useFirestore, useUser } from '@/firebase';
import { useMemo, useState, useEffect } from 'react';
import { doc, DocumentReference, collection, query, where, Query, getDocs, documentId, updateDoc } from 'firebase/firestore';
import { StudyGroup, UserProfile, UserStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CalendarDays, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/utils';
import { ONE_WEEK_IN_MS } from '@/lib/constants';
import TaskList from '@/components/TaskList';
import CheckInSystem from '@/components/CheckInSystem';
import MemberList from '@/components/MemberList';


export default function GroupDashboardPage({ params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const firestore = useFirestore();

  const groupDocRef = useMemo(() => {
    if (!groupId) return null;
    return doc(firestore, 'studyGroups', groupId) as DocumentReference<StudyGroup>;
  }, [groupId, firestore]);

  const { data: group, isLoading: isGroupLoading, error: groupError } = useDoc<StudyGroup>(groupDocRef);


  if (isGroupLoading) {
    return <div className="text-center py-10 p-4 md:p-10">Loading group dashboard...</div>;
  }
  
  if (groupError) {
      return <div className="text-center py-10 text-destructive p-4 md:p-10">Error loading group data.</div>
  }

  if (!group) {
    return <div className="text-center py-10 p-4 md:p-10">Group not found.</div>;
  }

  const isNew = group.createdAt && (Date.now() - (group.createdAt as any).toMillis()) < ONE_WEEK_IN_MS;

  return (
    <div className="space-y-8 p-4 md:p-10">
        <Link href="/studygroups" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Groups
        </Link>
      
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className='space-y-2'>
                <div className="flex flex-wrap items-center gap-4">
                    <CardTitle className="font-headline text-3xl">{group.name}</CardTitle>
                     {isNew ? (
                        <Badge>New</Badge>
                    ) : (
                        <Badge variant="secondary">In Progress</Badge>
                    )}
                </div>
                <CardDescription>{group.description}</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="flex flex-wrap gap-4 items-center">
             <Badge variant="secondary" className="text-base">{group.topic}</Badge>
             <Badge variant="outline" className="text-base">{group.commitment}</Badge>
             {group.commitmentDays && group.commitmentDays.length > 0 && (
                <Badge variant="outline" className="text-base">
                    {group.commitmentDays.join(', ')}
                </Badge>
            )}
           </div>
           <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4 mr-2" />
                Created on {formatTimestamp(group.createdAt as any)}
           </div>
        </CardContent>
      </Card>

      <TaskList 
        groupOrCohortId={groupId}
        collectionPath="studyGroups"
        memberIds={group.memberIds}
      />

      <CheckInSystem
        groupOrCohortId={groupId}
        collectionPath="studyGroups"
        memberIds={group.memberIds}
      />

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Members ({group.memberIds.length})
            </CardTitle>
        </CardHeader>
        <CardContent>
            <MemberList memberIds={group.memberIds} />
        </CardContent>
      </Card>

    </div>
  );
}
