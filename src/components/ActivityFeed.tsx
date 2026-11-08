'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { collection, limit, orderBy, query, type Query } from 'firebase/firestore';
import { AlarmClock, CheckSquare, FolderGit2, Handshake, ListPlus, LogIn, LogOut, MailPlus, MessageSquare, UserPlus } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNow } from '@/lib/hooks/useClientValues';
import { timeAgo } from '@/lib/utils';
import type { FeedEntry } from '@/lib/types';

const SHOWN = 20;

const ICONS: Record<FeedEntry['type'], React.ReactNode> = {
    follow: <UserPlus className="h-4 w-4 text-primary" aria-hidden="true" />,
    group_join: <LogIn className="h-4 w-4 text-green-600" aria-hidden="true" />,
    group_leave: <LogOut className="h-4 w-4 text-muted-foreground" aria-hidden="true" />,
    checkin: <MessageSquare className="h-4 w-4 text-blue-500" aria-hidden="true" />,
    task_added: <ListPlus className="h-4 w-4 text-amber-600" aria-hidden="true" />,
    task_done: <CheckSquare className="h-4 w-4 text-green-600" aria-hidden="true" />,
    request: <MailPlus className="h-4 w-4 text-primary" aria-hidden="true" />,
    request_accepted: <Handshake className="h-4 w-4 text-green-600" aria-hidden="true" />,
    solo_project: <FolderGit2 className="h-4 w-4 text-purple-600" aria-hidden="true" />,
    reminder: <AlarmClock className="h-4 w-4 text-primary" aria-hidden="true" />,
};

function ActivityItem({ entry, now }: { entry: FeedEntry; now: number | null }) {
    return (
        <Link href={entry.link || '#'} className="flex items-start gap-3 p-3 hover:bg-accent/50 rounded-lg">
            <div className="relative flex-shrink-0">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={entry.actorPhoto || undefined} alt="" />
                    <AvatarFallback>{entry.actorName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">{ICONS[entry.type]}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm">{entry.message}</p>
                {entry.detail && (
                    <blockquote className="mt-1 border-l-2 pl-3 text-sm text-muted-foreground italic break-words">
                        &quot;{entry.detail}&quot;
                    </blockquote>
                )}
                {/* Relative times depend on the clock, so they're filled in by the browser */}
                {now !== null && <p className="text-xs text-muted-foreground mt-1">{timeAgo(entry.createdAt, now)}</p>}
            </div>
        </Link>
    );
}

/**
 * The member's recent activity, from their feed (users/{uid}/feed): what
 * they did, and what happened in their groups and with people they know.
 */
export default function ActivityFeed({ uid }: { uid: string }) {
    const firestore = useFirestore();
    const now = useNow();
    const feedQuery = useMemo(
        () => query(collection(firestore, 'users', uid, 'feed'), orderBy('createdAt', 'desc'), limit(SHOWN)) as Query<FeedEntry>,
        [firestore, uid],
    );
    const { data: entries, isLoading } = useCollection<FeedEntry>(feedQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>What&apos;s been happening in your groups, your mentorships and with people you follow.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
                                <div className="h-9 w-9 rounded-full bg-muted" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-muted rounded w-3/4" />
                                    <div className="h-3 bg-muted rounded w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : entries && entries.length > 0 ? (
                    <div className="space-y-1">
                        {entries.map(entry => <ActivityItem key={entry.id} entry={entry} now={now} />)}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">No recent activity yet.</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Join a <Link href="/studygroups" className="text-primary underline">study group</Link> or{' '}
                            <Link href="/groupprojects" className="text-primary underline">project</Link> to get started!
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
