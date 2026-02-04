'use client';

import { useDoc, useCollection } from '@/firebase/firestore';
import { useMemo, useState } from 'react';
import { doc, DocumentReference, collection, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Competition, CompetitionEntry, UserProfile, SoloProject } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Trophy, User, PlusCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import SubmitCompetitionEntryForm from '@/components/forms/SubmitCompetitionEntryForm';

function CompetitionDashboardPageSkeleton() {
    return (
        <div className="p-4 md:p-10 space-y-8 animate-pulse">
            <div className="h-6 w-48 bg-muted rounded"></div>
            <Card>
                <CardHeader>
                    <div className="h-8 w-3/4 bg-muted rounded"></div>
                    <div className="h-4 w-1/2 bg-muted rounded mt-2"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                         <div className="h-6 w-full bg-muted rounded"></div>
                         <div className="h-6 w-full bg-muted rounded"></div>
                         <div className="h-6 w-full bg-muted rounded"></div>
                         <div className="h-6 w-full bg-muted rounded"></div>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <div className="h-7 w-48 bg-muted rounded"></div>
                </CardHeader>
                 <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="h-40 bg-muted rounded-lg"></div>
                    <div className="h-40 bg-muted rounded-lg"></div>
                    <div className="h-40 bg-muted rounded-lg"></div>
                 </CardContent>
            </Card>
        </div>
    );
}

function EntryCard({ entry }: { entry: CompetitionEntry }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
            <a href={entry.projectUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-2">
                Project Link <ExternalLink className="h-4 w-4" />
            </a>
        </CardTitle>
        <CardDescription>
            <Link href={`/users/${entry.userId}`} className="flex items-center gap-2 text-sm hover:underline">
                <User className="h-4 w-4" />
                {entry.username}
            </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 h-[60px]">{entry.description}</p>
        <p className="text-xs text-muted-foreground mt-2">Submitted: {formatTimestamp(entry.submittedAt, true)}</p>
      </CardContent>
    </Card>
  );
}


export default function CompetitionDashboardPage({ params }: { params: { competitionId: string } }) {
  const { competitionId } = params;
  const { user } = useUser();
  const firestore = useFirestore();

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const competitionDocRef = useMemo(() => doc(firestore, 'competitions', competitionId) as DocumentReference<Competition>, [competitionId, firestore]);
  const { data: competition, isLoading, error } = useDoc<Competition>(competitionDocRef);

  const entriesCollectionRef = useMemo(() => collection(firestore, 'competitions', competitionId, 'entries'), [competitionId, firestore]);
  const entriesQuery = useMemo(() => query(entriesCollectionRef, orderBy('submittedAt', 'desc')), [entriesCollectionRef]);
  const { data: entries, isLoading: isLoadingEntries } = useCollection<CompetitionEntry>(entriesQuery);

  const creatorDocRef = useMemo(() => competition ? doc(firestore, 'users', competition.creatorId) as DocumentReference<UserProfile> : null, [competition, firestore]);
  const { data: creator } = useDoc<UserProfile>(creatorDocRef);
  
  const userSoloProjectsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, 'soloProjects'), where('userId', '==', user.uid));
  }, [user, firestore]);
  const {data: userSoloProjects } = useCollection<SoloProject>(userSoloProjectsQuery);
  
  const userHasSubmitted = useMemo(() => {
      if (!user || !entries) return false;
      return entries.some(entry => entry.userId === user.uid);
  }, [user, entries]);

  if (isLoading) return <CompetitionDashboardPageSkeleton />;
  if (error) return <div className="text-center py-10 text-destructive p-4 md:p-10">Error loading competition data.</div>;
  if (!competition) return <div className="text-center py-10 p-4 md:p-10">Competition not found.</div>;
  
  const now = Timestamp.now();
  const isActive = now >= competition.startDate && now <= competition.endDate;

  return (
    <div className="space-y-8 p-4 md:p-10">
        <Link href="/competitions" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Competitions
        </Link>
      
      <Card>
        <CardHeader>
            <div className="flex flex-wrap items-center gap-4">
                <CardTitle className="font-headline text-3xl">{competition.name}</CardTitle>
                <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Active' : (now > competition.endDate ? 'Past' : 'Upcoming')}</Badge>
            </div>
            <CardDescription className="pt-2">{competition.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex items-start gap-3"><Calendar className="w-5 h-5 mt-1 flex-shrink-0" /><p><span className="font-semibold">Starts:</span> {formatTimestamp(competition.startDate, true)}</p></div>
                <div className="flex items-start gap-3"><Clock className="w-5 h-5 mt-1 flex-shrink-0" /><p><span className="font-semibold">Ends:</span> {formatTimestamp(competition.endDate, true)}</p></div>
                <div className="flex items-start gap-3"><Trophy className="w-5 h-5 mt-1 flex-shrink-0" /><p><span className="font-semibold">Prize:</span> {competition.prize}</p></div>
                {creator && <div className="flex items-start gap-3"><User className="w-5 h-5 mt-1 flex-shrink-0" /><p><span className="font-semibold">Hosted by:</span> <Link href={`/users/${creator.id}`} className="font-semibold hover:underline">{creator.username}</Link></p></div>}
           </div>
        </CardContent>
      </Card>
      
       <Card>
            <CardHeader>
                <CardTitle>Rules</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap">{competition.rules}</p>
            </CardContent>
       </Card>

        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Entries ({entries?.length || 0})</CardTitle>
                    <CardDescription>Projects submitted by the community.</CardDescription>
                </div>
                 {user && isActive && !userHasSubmitted && (
                    <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Submit Entry
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Submit Your Entry</DialogTitle>
                                <DialogDescription>Fill out the form to enter the competition.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <SubmitCompetitionEntryForm
                                    user={user}
                                    competitionId={competitionId}
                                    userSoloProjects={userSoloProjects || []}
                                    onSuccess={() => setIsSubmitModalOpen(false)}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
                {user && isActive && userHasSubmitted && <Button disabled>You have already submitted</Button>}
                {user && !isActive && <Button disabled>{now > competition.endDate ? 'Competition Ended' : 'Not Started Yet'}</Button>}
            </CardHeader>
            <CardContent>
                {isLoadingEntries ? <p>Loading entries...</p> : entries && entries.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {entries.map(entry => <EntryCard key={entry.id} entry={entry} />)}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No entries have been submitted yet.</p>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
