'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, doc, limit, orderBy, query, where } from 'firebase/firestore';
import { ShieldCheck, X } from 'lucide-react';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import PostCard from '@/components/posts/PostCard';
import PostComposer from '@/components/posts/PostComposer';
import { useFeedPrefs } from '@/lib/hooks/useFeedPrefs';
import { useIsModerator } from '@/lib/hooks/useIsModerator';
import { useDocsByIds } from '@/lib/hooks/useDocsByIds';
import { MAX_FOLLOWED_TOPICS, parseTopics } from '@/lib/member-posts';
import type { MemberPost, MemberStanding, UserProfile } from '@/lib/types';

const RECENT_LIMIT = 50;
const FOLLOWED_LIMIT = 20;
// Firestore's "in" and "array-contains-any" filters take at most 30 values
const MAX_QUERY_VALUES = 30;

const newestFirst = (a: MemberPost, b: MemberPost) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0);

/** The topics a member follows, with a box to add more */
function TopicSettings({ topics, onFollow, onUnfollow }: { topics: string[]; onFollow: (topic: string) => void; onUnfollow: (topic: string) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    parseTopics(input).forEach(onFollow);
    setInput('');
  };
  return (
    <div className="space-y-2">
      <Label htmlFor="follow-topic">Topics you follow</Label>
      <div className="flex flex-wrap gap-1">
        {topics.length === 0 && <p className="text-sm text-muted-foreground">None yet. Posts on these topics come first.</p>}
        {topics.map(topic => (
          <Badge key={topic} variant="secondary" className="gap-1">
            #{topic}
            <button type="button" onClick={() => onUnfollow(topic)} aria-label={`Unfollow ${topic}`}><X className="h-3 w-3" /></button>
          </Badge>
        ))}
      </div>
      {topics.length < MAX_FOLLOWED_TOPICS && (
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); add(); }}>
          <Input id="follow-topic" value={input} onChange={e => setInput(e.target.value)} placeholder="react" />
          <Button type="submit" variant="outline" disabled={!input.trim()}>Follow</Button>
        </form>
      )}
    </div>
  );
}

/** Muted or blocked members, with a button to undo it */
function HiddenMembers({ label, ids, action, onUndo }: { label: string; ids: string[]; action: string; onUndo: (id: string) => void }) {
  const { data: members } = useDocsByIds<UserProfile>('users', ids);
  if (ids.length === 0) return null;
  const names = new Map((members ?? []).map(member => [member.id, member.username]));
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}</p>
      <ul className="space-y-1">
        {ids.map(id => (
          <li key={id} className="flex items-center justify-between text-sm">
            <span>{names.get(id) ?? 'A member'}</span>
            <Button variant="ghost" size="sm" onClick={() => onUndo(id)}>{action}</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The community feed; `initial` is the server's copy of the recent posts, shown until the live list loads */
export default function MemberFeed({ initial }: { initial: unknown[] | null }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const isModerator = useIsModerator();
  const prefs = useFeedPrefs();

  const profileRef = useMemo(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(profileRef);
  const standingRef = useMemo(() => (user ? doc(firestore, 'memberStandings', user.uid) : null), [firestore, user]);
  const { data: standing } = useDoc<MemberStanding>(standingRef);

  const recentQuery = useMemo(
    () => query(collection(firestore, 'memberPosts'), where('status', '==', 'visible'), orderBy('createdAt', 'desc'), limit(RECENT_LIMIT)),
    [firestore],
  );
  const { data: recent, isLoading } = useCollection<MemberPost>(recentQuery, initial);

  const following = profile?.following ?? [];
  const followingKey = following.slice(0, MAX_QUERY_VALUES).join(',');
  const followingQuery = useMemo(() => {
    if (!followingKey) return null;
    return query(collection(firestore, 'memberPosts'), where('status', '==', 'visible'), where('authorId', 'in', followingKey.split(',')),
      orderBy('createdAt', 'desc'), limit(FOLLOWED_LIMIT));
  }, [firestore, followingKey]);
  const { data: fromFollowing } = useCollection<MemberPost>(followingQuery);

  const topicsKey = prefs.topics.slice(0, MAX_QUERY_VALUES).join(',');
  const topicsQuery = useMemo(() => {
    if (!topicsKey) return null;
    return query(collection(firestore, 'memberPosts'), where('status', '==', 'visible'), where('topics', 'array-contains-any', topicsKey.split(',')),
      orderBy('createdAt', 'desc'), limit(FOLLOWED_LIMIT));
  }, [firestore, topicsKey]);
  const { data: fromTopics } = useCollection<MemberPost>(topicsQuery);

  // The member's own hidden posts, so they can see what happened
  const ownHiddenQuery = useMemo(
    () => (user ? query(collection(firestore, 'memberPosts'), where('authorId', '==', user.uid), where('status', '==', 'hidden')) : null),
    [firestore, user],
  );
  const { data: ownHidden } = useCollection<MemberPost>(ownHiddenQuery);

  const { followed, rest } = useMemo(() => {
    const skip = new Set([...prefs.mutedIds, ...prefs.blockedIds]);
    const shown = (post: MemberPost) => !skip.has(post.authorId);
    const followedById = new Map<string, MemberPost>();
    for (const post of [...(fromFollowing ?? []), ...(fromTopics ?? [])]) {
      if (shown(post) && post.authorId !== user?.uid) followedById.set(post.id, post);
    }
    return {
      followed: [...followedById.values()].sort(newestFirst),
      rest: (recent ?? []).filter(post => shown(post) && !followedById.has(post.id)),
    };
  }, [recent, fromFollowing, fromTopics, prefs.mutedIds, prefs.blockedIds, user?.uid]);

  const run = (action: () => Promise<unknown>, done: string) => {
    action()
      .then(() => toast({ title: done }))
      .catch(() => toast({ variant: 'destructive', title: 'Something went wrong', description: 'Please try again.' }));
  };
  const memberActions = user
    ? {
        onMute: (id: string) => run(() => prefs.mute(id), 'Muted. You won’t see their posts.'),
        onBlock: (id: string) => run(() => prefs.block(id), 'Blocked.'),
      }
    : {};

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-headline">Community Feed</h1>
          <p className="text-muted-foreground">Short posts from w3Develops members: what they&apos;re learning, building and sharing.</p>
        </div>
        {isModerator && (
          <Button asChild variant="outline">
            <Link href="/moderation"><ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" /> Moderation</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <main className="space-y-4 min-w-0">
          {standing && standing.warnings > 0 && standing.lastWarning && (
            <Alert>
              <AlertTitle>A moderator sent you a warning</AlertTitle>
              <AlertDescription>
                {standing.lastWarning} Please read the <Link href="/code-of-conduct" className="underline">Code of Conduct</Link>.
                To appeal, email <a href="mailto:w3DevelopsSupport@googlegroups.com" className="underline">w3DevelopsSupport@googlegroups.com</a>.
              </AlertDescription>
            </Alert>
          )}

          <PostComposer profile={profile} standing={standing} />

          {(ownHidden ?? []).sort(newestFirst).map(post => <PostCard key={post.id} post={post} />)}

          {followed.length > 0 && (
            <section aria-labelledby="followed-heading" className="space-y-4">
              <h2 id="followed-heading" className="text-lg font-semibold">From people and topics you follow</h2>
              {followed.map(post => <PostCard key={post.id} post={post} {...memberActions} />)}
            </section>
          )}

          <section aria-labelledby="recent-heading" className="space-y-4">
            <h2 id="recent-heading" className="text-lg font-semibold">Recent posts</h2>
            {isLoading && !recent && <p className="text-muted-foreground">Loading posts...</p>}
            {recent && rest.length === 0 && <p className="text-muted-foreground">No posts yet. Say hello!</p>}
            {rest.map(post => <PostCard key={post.id} post={post} {...memberActions} />)}
          </section>
        </main>

        <aside className="space-y-4">
          {user ? (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Your feed</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <TopicSettings
                  topics={prefs.topics}
                  onFollow={topic => run(() => prefs.followTopic(topic), `Following #${topic}`)}
                  onUnfollow={topic => run(() => prefs.unfollowTopic(topic), `Unfollowed #${topic}`)}
                />
                <p className="text-sm text-muted-foreground">
                  Posts from members you follow also come first. Find people on <Link href="/explore" className="underline">Explore</Link>.
                </p>
                <HiddenMembers label="Muted" ids={prefs.mutedIds} action="Unmute" onUndo={id => run(() => prefs.unmute(id), 'Unmuted')} />
                <HiddenMembers label="Blocked" ids={prefs.blockedIds} action="Unblock" onUndo={id => run(() => prefs.unblock(id), 'Unblocked')} />
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
              <p>Posts are public and follow our <Link href="/code-of-conduct" className="underline">Code of Conduct</Link>. There are no private messages.</p>
              <p>See something wrong? Use <strong>Report</strong> on the post. Posts with several reports are hidden until a moderator reviews them.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
