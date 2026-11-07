'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, query, where } from 'firebase/firestore';
import { useCollection, useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FindGroupModal from '@/components/groups/FindGroupModal';
import ItemList from '@/components/account/ItemList';
import { GROUP_KINDS, type GroupKind } from '@/lib/groups';
import type { Group } from '@/lib/types';

// What the account page says about each kind of group
const COPY: Record<GroupKind, { description: string; empty: string; explore: string; join: string }> = {
  studyGroup: {
    description: 'Groups you are a member of to learn and collaborate.',
    empty: "You haven't joined any groups yet.",
    explore: 'Explore Groups', join: 'Join a Group',
  },
  groupProject: {
    description: 'Projects you have created or joined to build applications.',
    empty: "You haven't joined any group projects yet.",
    explore: 'Explore Projects', join: 'Join a Project',
  },
  bookClub: {
    description: 'Book clubs you have created or joined.',
    empty: "You haven't joined any book clubs yet.",
    explore: 'Explore Clubs', join: 'Join a Club',
  },
};

/** The groups of one kind that this member belongs to */
export default function GroupListCard({ kind, uid }: { kind: GroupKind; uid: string }) {
  const firestore = useFirestore();
  const config = GROUP_KINDS[kind];
  const copy = COPY[kind];
  const [isFindOpen, setIsFindOpen] = useState(false);

  const groupsQuery = useMemo(
    () => query(collection(firestore, config.collection), where('memberIds', 'array-contains', uid)),
    [firestore, config.collection, uid]
  );
  const { data: groups, isLoading } = useCollection<Group>(groupsQuery);

  return (
    <Card>
      <FindGroupModal kind={kind} isOpen={isFindOpen} onClose={() => setIsFindOpen(false)} />
      <CardHeader>
        <CardTitle>Your {config.plural}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ItemList
          items={groups}
          isLoading={isLoading}
          empty={<p className="text-sm text-muted-foreground">{copy.empty}</p>}
          renderItem={group => (
            <Link href={`${config.path}/${group.id}`} className="font-medium hover:underline">{group.name}</Link>
          )}
        />
        <div className="flex gap-2 pt-4">
          <Button asChild size="sm" variant="secondary">
            <Link href={config.path}>{copy.explore}</Link>
          </Button>
          <Button size="sm" onClick={() => setIsFindOpen(true)}>{copy.join}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
