'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { arrayUnion, doc, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { StudyGroup, BookClub, GroupProject } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ONE_WEEK_IN_MS } from '@/lib/constants';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const MAX_MEMBERS = 25;

// Study groups, book clubs and group projects all join the same way,
// so the differences live here instead of in three copies of the button
const KINDS = {
    studyGroup: { collection: 'studyGroups', userField: 'joinedStudyGroupIds', path: '/studygroups', noun: 'group', label: 'Group', fullName: 'study group' },
    bookClub: { collection: 'bookClubs', userField: 'joinedBookClubIds', path: '/book-clubs', noun: 'club', label: 'Club', fullName: 'book club' },
    groupProject: { collection: 'groupProjects', userField: 'joinedGroupProjectIds', path: '/groupprojects', noun: 'project', label: 'Project', fullName: 'group project' },
} as const;

export type JoinKind = keyof typeof KINDS;

export default function JoinButton({ kind, item, onJoinSuccess }: {
    kind: JoinKind;
    item: StudyGroup | BookClub | GroupProject;
    onJoinSuccess?: (id: string) => void;
}) {
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const router = useRouter();
    const [isJoining, setIsJoining] = useState(false);
    const config = KINDS[kind];

    if (!user) return null;

    const isMember = item.memberIds.includes(user.uid);
    const isFull = item.memberIds.length >= MAX_MEMBERS;
    const isNew = item.createdAt && (Date.now() - item.createdAt.toMillis()) < ONE_WEEK_IN_MS;
    const canJoin = isNew && !isFull && !isMember;
    const itemLink = `${config.path}/${item.id}`;

    if (isMember) {
        return (
            <Button variant="outline" asChild size="sm">
                <Link href={itemLink}>View {config.label}</Link>
            </Button>
        );
    }

    if (isFull) {
        return <Button size="sm" disabled>{config.label} Full</Button>;
    }

    const handleJoin = async () => {
        if (!isNew) {
            toast({
                variant: "destructive",
                title: "Unable to Join",
                description: `This ${config.noun} is already in progress. You can only join ${config.noun}s marked as 'New'.`,
                duration: 6000,
            });
            return;
        }

        setIsJoining(true);

        const itemRef = doc(firestore, config.collection, item.id);
        const userProfileRef = doc(firestore, 'users', user.uid);
        const batch = writeBatch(firestore);

        batch.update(itemRef, { memberIds: arrayUnion(user.uid) });
        batch.update(userProfileRef, { [config.userField]: arrayUnion(item.id) });

        const becomesFull = item.memberIds.length + 1 === MAX_MEMBERS;
        if (becomesFull) {
            const message = `Your ${config.fullName} "${item.name}" is now full!`;
            [...item.memberIds, user.uid].forEach(memberId => {
                const notificationRef = doc(collection(firestore, 'users', memberId, 'notifications'));
                batch.set(notificationRef, {
                    id: notificationRef.id,
                    message,
                    link: itemLink,
                    isRead: false,
                    createdAt: serverTimestamp(),
                });
            });
        }

        batch.commit()
            .then(() => {
                if (becomesFull) {
                    toast({ title: `${config.label} Full!`, description: 'Notifications sent to all members.' });
                }
                toast({ title: 'Success!', description: `You've joined the ${config.noun}: ${item.name}` });

                if (onJoinSuccess) {
                    onJoinSuccess(item.id);
                } else {
                    router.push(itemLink);
                }
            })
            .catch(() => {
                const permissionError = new FirestorePermissionError({
                    path: `batch write to join ${config.fullName} ${item.id}`,
                    operation: 'update',
                    requestResourceData: { itemId: item.id, userId: user.uid }
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Could Not Join', description: "A permission error occurred." });
            })
            .finally(() => {
                setIsJoining(false);
            });
    };

    return (
        <Button onClick={handleJoin} disabled={isJoining || !canJoin} size="sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            {isJoining ? 'Joining...' : `Join ${config.label}`}
        </Button>
    );
}
