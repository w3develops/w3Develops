'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { doc, type DocumentReference, type Timestamp } from 'firebase/firestore';
import { ArrowLeft, CalendarDays, GitBranch, GraduationCap, type LucideIcon } from 'lucide-react';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TaskList from '@/components/TaskList';
import CheckInSystem from '@/components/CheckInSystem';
import SharedNoteEditor from '@/components/SharedNoteEditor';
import { formatTimestamp } from '@/lib/utils';
import type { UserProfile } from '@/lib/types';

// A mentorship, tutorship or pairing: two members sharing notes, tasks and
// check-ins. Mentorships and tutorships have roles; pairings don't.
interface ConnectionKind {
  collection: 'mentorships' | 'tutorships' | 'pairings';
  name: string;                // "Mentorship"
  icon: LucideIcon;
  backHref: string;
  backLabel: string;
  dateLabel: string;           // "Started on"
  roles?: { offererField: string; offerer: string; seeker: string };
}

const KINDS = {
  mentorship: {
    collection: 'mentorships', name: 'Mentorship', icon: GraduationCap,
    backHref: '/mentorship', backLabel: 'Back to Mentorship', dateLabel: 'Started on',
    roles: { offererField: 'mentorId', offerer: 'Mentor', seeker: 'Mentee' },
  },
  tutorship: {
    collection: 'tutorships', name: 'Tutorship', icon: GraduationCap,
    backHref: '/tutor', backLabel: 'Back to Tutoring', dateLabel: 'Started on',
    roles: { offererField: 'tutorId', offerer: 'Tutor', seeker: 'Student' },
  },
  pairing: {
    collection: 'pairings', name: 'Pairing', icon: GitBranch,
    backHref: '/pair-programming', backLabel: 'Back to Pair Programming', dateLabel: 'Paired on',
  },
} satisfies Record<string, ConnectionKind>;

export type ConnectionKindName = keyof typeof KINDS;

interface Connection {
  id: string;
  memberIds: string[];
  createdAt?: Timestamp;
  [roleField: string]: unknown;
}

function PartnerCard({ profile, label, Icon }: { profile: UserProfile; label: string; Icon: LucideIcon }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Icon /> Your {label}</CardTitle>
      </CardHeader>
      <CardContent>
        <Link href={`/users/${profile.id}`} className="flex items-center gap-4 group">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.profilePictureUrl} />
            <AvatarFallback className="text-2xl">{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xl font-bold group-hover:underline">{profile.username}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}

const Message = ({ children, error }: { children: string; error?: boolean }) => (
  <div className={`text-center py-10 p-4 md:p-10${error ? ' text-destructive' : ''}`}>{children}</div>
);

/** The shared page for one mentorship, tutorship or pairing */
export default function ConnectionSpace({ kind, id }: { kind: ConnectionKindName; id: string }) {
  const config: ConnectionKind = KINDS[kind];
  const lower = config.name.toLowerCase();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const connectionRef = useMemo(
    () => (id ? doc(firestore, config.collection, id) as DocumentReference<Connection> : null),
    [id, firestore, config.collection]
  );
  const { data: connection, isLoading: isConnectionLoading, error } = useDoc<Connection>(connectionRef);

  const partnerId = user && connection ? connection.memberIds.find(memberId => memberId !== user.uid) : undefined;
  const partnerRef = useMemo(
    () => (partnerId ? doc(firestore, 'users', partnerId) as DocumentReference<UserProfile> : null),
    [partnerId, firestore]
  );
  const { data: partner, isLoading: isPartnerLoading } = useDoc<UserProfile>(partnerRef);

  if (isConnectionLoading || isUserLoading || isPartnerLoading) return <Message>{`Loading ${lower} dashboard...`}</Message>;
  if (!user) return <Message>Please log in to view this page.</Message>;
  if (error) return <Message error>{`Error loading ${lower} data.`}</Message>;
  if (!connection) return <Message>{`${config.name} not found.`}</Message>;
  if (!connection.memberIds.includes(user.uid)) return <Message error>You do not have permission to view this page.</Message>;
  if (!partner) return <Message>Loading partner information...</Message>;

  const { roles } = config;
  const iAmOfferer = roles ? connection[roles.offererField] === user.uid : false;
  const partnerLabel = roles ? (iAmOfferer ? roles.seeker : roles.offerer) : 'Partner';
  const description = roles
    ? `This is your shared dashboard. You are the ${iAmOfferer ? roles.offerer : roles.seeker}.`
    : 'This is your shared dashboard for pair programming.';

  return (
    <div className="space-y-8 p-4 md:p-10">
      <Link href={config.backHref} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {config.backLabel}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{config.name} with {partner.username}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="w-4 h-4 mr-2" />
            {config.dateLabel} {formatTimestamp(connection.createdAt)}
          </div>
        </CardContent>
      </Card>

      <PartnerCard profile={partner} label={partnerLabel} Icon={config.icon} />

      <Card>
        <CardContent className="p-6">
          <SharedNoteEditor collectionPath={config.collection} sessionId={id} />
        </CardContent>
      </Card>

      <TaskList parentId={id} collectionPath={config.collection} memberIds={connection.memberIds} />
      <CheckInSystem parentId={id} collectionPath={config.collection} memberIds={connection.memberIds} />
    </div>
  );
}
