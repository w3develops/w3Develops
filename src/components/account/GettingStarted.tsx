'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { User } from 'firebase/auth';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { CheckCircle2, Circle, Rocket, X } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GROUP_KINDS } from '@/lib/groups';
import { needsEmailVerification } from '@/lib/hooks/useVerifiedGuard';
import type { UserProfile } from '@/lib/types';

// Hiding the list is a per-browser convenience, so it lives in localStorage
const DISMISSED_KEY = 'w3d-getting-started-dismissed';

interface Step {
  done: boolean;
  title: string;
  description: string;
  /** Where to go to do it, if there's a page for it */
  link?: { href: string; label: string };
}

const hasAny = (list?: string[]) => !!list && list.length > 0;

const readDismissed = () => {
  try { return localStorage.getItem(DISMISSED_KEY) === '1'; } catch { return false; }
};
const noSubscription = () => () => {};

/**
 * A short "what to do next" list for members who are still finding their
 * way around. It hides itself once every step is done, or when dismissed.
 */
export default function GettingStarted({ user, profile }: { user: User; profile: UserProfile }) {
  const firestore = useFirestore();
  const [inAGroup, setInAGroup] = useState<boolean | null>(null);
  // Hidden on the server and until the browser's choice is known
  const dismissedBefore = useSyncExternalStore(noSubscription, readDismissed, () => true);
  const [dismissedNow, setDismissedNow] = useState(false);
  const dismissed = dismissedBefore || dismissedNow;

  useEffect(() => {
    let cancelled = false;
    Promise.all(Object.values(GROUP_KINDS).map(kind =>
      getDocs(query(collection(firestore, kind.collection), where('memberIds', 'array-contains', user.uid), limit(1)))
    ))
      .then(results => { if (!cancelled) setInAGroup(results.some(snap => !snap.empty)); })
      .catch(() => { if (!cancelled) setInAGroup(false); });
    return () => { cancelled = true; };
  }, [firestore, user.uid]);

  const steps: Step[] = [
    {
      done: !needsEmailVerification(user),
      title: 'Verify your email',
      description: 'Open the link we emailed you, so you can join groups and post check-ins. The banner at the top of the page can send it again.',
    },
    {
      done: !!profile.bio?.trim() && hasAny(profile.skills),
      title: 'Add a bio and your skills',
      description: 'It helps groups and mentors get to know you, and lets other members find your profile.',
      link: { href: '/profile/edit', label: 'Edit your profile' },
    },
    {
      done: inAGroup === true,
      title: 'Join a study group, project or book club',
      description: 'Groups take new members in their first week. Join one, or start your own.',
      link: { href: '/studygroups', label: 'Find a group' },
    },
    {
      done: hasAny(profile.mentorIds) || hasAny(profile.menteeIds) || hasAny(profile.tutorIds)
        || hasAny(profile.studentIds) || hasAny(profile.pairPartnerIds),
      title: 'Find a mentor, tutor or pair programming partner',
      description: 'Get one-on-one help, or offer it to someone else.',
      link: { href: '/mentorship', label: 'Explore mentorship' },
    },
    {
      done: hasAny(profile.following),
      title: 'Follow another member',
      description: 'Search for people learning the same things as you.',
      link: { href: '/search', label: 'Search members' },
    },
  ];

  const doneCount = steps.filter(step => step.done).length;
  // Wait for the group check, so a finished list doesn't flash up and vanish
  if (dismissed || inAGroup === null || doneCount === steps.length) return null;

  const dismiss = () => {
    setDismissedNow(true);
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* the list just comes back next time */ }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" aria-hidden="true" /> Getting started</CardTitle>
          <CardDescription>{doneCount} of {steps.length} done. Here&apos;s what to do next on w3Develops.</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={dismiss} aria-label="Hide the getting started list">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {steps.map(step => (
            <li key={step.title} className="flex items-start gap-3">
              {step.done
                ? <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-green-600" aria-hidden="true" />
                : <Circle className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />}
              <div className="flex-1 space-y-1">
                <p className={step.done ? 'font-medium text-muted-foreground line-through' : 'font-medium'}>
                  <span className="sr-only">{step.done ? 'Done: ' : 'To do: '}</span>{step.title}
                </p>
                {!step.done && (
                  <>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.link && <Link href={step.link.href} className="text-sm text-primary underline">{step.link.label}</Link>}
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
