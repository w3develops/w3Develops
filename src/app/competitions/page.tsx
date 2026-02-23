'use client';

import { useState, useMemo } from 'react';
import { useCollection, useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Competition } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trophy, Calendar, Clock } from 'lucide-react';
import { formatTimestamp } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function CompetitionCard({ competition }: { competition: Competition }) {
    const now = Timestamp.now();
    let status: 'Active' | 'Upcoming' | 'Past' = 'Upcoming';
    let statusVariant: "default" | "secondary" | "outline" = "outline";

    if (now >= competition.startDate && now <= competition.endDate) {
        status = 'Active';
        statusVariant = 'default';
    } else if (now > competition.endDate) {
        status = 'Past';
        statusVariant = 'secondary';
    }

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl line-clamp-2">{competition.name}</CardTitle>
                    <Badge variant={statusVariant}>{status}</Badge>
                </div>
                 <CardDescription className="line-clamp-3 h-[60px]">{competition.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-grow">
                <div className="space-y-3 text-sm text-muted-foreground">
                   <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span>Prize: {competition.prize || 'Bragging rights'}</span>
                    </div>
                    {competition.startTimeUTC && (
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Starts: {competition.startTimeUTC} UTC</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Date: {formatTimestamp(competition.startDate)}</span>
                    </div>
                </div>
                <Button asChild className="mt-4 w-full">
                    <Link href={`/competitions/${competition.id}`}>View Competition</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function CompetitionsPageSkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
                 <Card key={i} className="animate-pulse">
                    <CardHeader>
                        <div className="h-6 w-3/4 bg-muted rounded"></div>
                        <div className="h-4 w-full bg-muted rounded mt-2"></div>
                        <div className="h-4 w-5/6 bg-muted rounded"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-5 w-1/3 bg-muted rounded mb-2"></div>
                        <div className="h-5 w-1/2 bg-muted rounded mb-2"></div>
                         <div className="h-5 w-1/2 bg-muted rounded mb-4"></div>
                        <div className="h-10 w-full bg-muted rounded-md mt-4"></div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function CompetitionsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const competitionsQuery = useMemo(() => query(collection(firestore, 'competitions'), orderBy('endDate', 'desc')), [firestore]);
    const { data: competitions, isLoading } = useCollection<Competition>(competitionsQuery);

    const { active, upcoming, past } = useMemo(() => {
        if (!competitions) return { active: [], upcoming: [], past: [] };
        const now = Timestamp.now();
        const active: Competition[] = [];
        const upcoming: Competition[] = [];
        const past: Competition[] = [];

        competitions.forEach(comp => {
            if (now >= comp.startDate && now <= comp.endDate) {
                active.push(comp);
            } else if (now < comp.startDate) {
                upcoming.push(comp);
            } else {
                past.push(comp);
            }
        });
        return { active, upcoming, past };
    }, [competitions]);

    return (
        <div className="p-4 md:p-10 space-y-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-headline">Competitions</h1>
                <p className="text-muted-foreground">Test your skills in our community coding challenges. Times shown in UTC.</p>
              </div>
              {user && (
                <Button asChild>
                  <Link href="/competitions/create">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Competition
                  </Link>
                </Button>
              )}
            </div>
            
            <div className="mt-8 border-t pt-8">
                <Card className="bg-secondary/50">
                    <CardHeader>
                        <CardTitle>Looking for Bug Bounties?</CardTitle>
                        <CardDescription>
                            Explore external platforms for security vulnerability rewards.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline">
                            <Link href="/bug-bounties">
                                Explore Bug Bounties
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="pt-6">
                    {isLoading ? <CompetitionsPageSkeleton /> : active.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {active.map(comp => <CompetitionCard key={comp.id} competition={comp} />)}
                        </div>
                    ) : <p className="text-center text-muted-foreground py-8">No active competitions right now.</p>}
                </TabsContent>
                 <TabsContent value="upcoming" className="pt-6">
                    {isLoading ? <CompetitionsPageSkeleton /> : upcoming.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {upcoming.map(comp => <CompetitionCard key={comp.id} competition={comp} />)}
                        </div>
                    ) : <p className="text-center text-muted-foreground py-8">No upcoming competitions scheduled. Check back soon!</p>}
                </TabsContent>
                <TabsContent value="past" className="pt-6">
                     {isLoading ? <CompetitionsPageSkeleton /> : past.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {past.map(comp => <CompetitionCard key={comp.id} competition={comp} />)}
                        </div>
                    ) : <p className="text-center text-muted-foreground py-8">No past competitions yet.</p>}
                </TabsContent>
            </Tabs>
        </div>
    );
}