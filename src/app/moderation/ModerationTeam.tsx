'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useCollection, useFirebaseApp, useFirestore, useUser } from '@/firebase';
import { appFunctions } from '@/firebase/initialize-app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import type { Moderator } from '@/lib/types';

type SetModerator = { username: string; moderator: boolean };
type SetModeratorResult = { uid: string; username: string };

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Please try again.';
}

/**
 * Who moderates the feed. Admins (the `admin` claim) can add a moderator by
 * username or remove one, through the setModerator function, which sets their
 * claim and logs the change.
 */
export default function ModerationTeam({ isAdmin }: { isAdmin: boolean }) {
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const { user } = useUser();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const teamQuery = useMemo(() => query(collection(firestore, 'moderators'), orderBy('username')), [firestore]);
  const { data: team } = useCollection<Moderator>(teamQuery);

  const change = async (name: string, moderator: boolean) => {
    setBusy(name);
    try {
      const call = httpsCallable<SetModerator, SetModeratorResult>(appFunctions(app), 'setModerator');
      const { data } = await call({ username: name, moderator });
      toast({
        title: moderator ? `${data.username} is now a moderator` : `${data.username} is no longer a moderator`,
        description: 'It takes effect next time they sign in, or within an hour.',
      });
      if (moderator) setUsername('');
    } catch (error) {
      toast({ variant: 'destructive', title: "Couldn't change that", description: errorMessage(error) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Moderation team</CardTitle>
        <CardDescription>
          {isAdmin ? 'Add a member by their username, or remove someone. Every change is in the log.' : 'Ask an admin to add or remove moderators.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin && (
          <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={e => { e.preventDefault(); if (username.trim()) change(username.trim(), true); }}>
            <div className="grid flex-1 gap-1">
              <Label htmlFor="new-moderator">Username</Label>
              <Input id="new-moderator" value={username} onChange={e => setUsername(e.target.value)} placeholder="their w3Develops username" autoComplete="off" />
            </div>
            <Button type="submit" disabled={!username.trim() || busy !== null}>{busy === username.trim() ? 'Adding...' : 'Make moderator'}</Button>
          </form>
        )}
        {team && team.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No one is listed yet. Moderators set up before this list existed only appear once they&apos;re added here.
          </p>
        )}
        <ul className="divide-y">
          {(team ?? []).map(member => (
            <li key={member.id} className="flex items-center justify-between py-2 text-sm">
              <Link href={`/users/${member.id}`} className="font-medium hover:underline">{member.username}</Link>
              {isAdmin && member.id !== user?.uid && (
                <Button variant="ghost" size="sm" className="text-destructive" disabled={busy !== null} onClick={() => change(member.username, false)}>
                  {busy === member.username ? 'Removing...' : 'Remove'}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
