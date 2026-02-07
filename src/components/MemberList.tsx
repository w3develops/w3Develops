
'use client';

import { useFirestore, useUser } from '@/firebase';
import { useState, useEffect } from 'react';
import { UserProfile, UserStatus } from '@/lib/types';
import { collection, query, where, getDocs, documentId, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { getDerivedUserStatus } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { MoreVertical } from 'lucide-react';

const statusColors: Record<UserStatus, string> = {
  active: 'bg-green-500',
  paused: 'bg-red-500',
  inactive: 'bg-gray-500',
};

export default function MemberList({ memberIds }: { memberIds: string[] }) {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const { toast } = useToast();
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            if (!memberIds || memberIds.length === 0) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                // Firestore 'in' queries are limited to 30 elements.
                const membersQuery = query(collection(firestore, 'users'), where(documentId(), 'in', memberIds.slice(0, 30)));
                const snapshot = await getDocs(membersQuery);
                const memberData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
                setMembers(memberData);
            } catch (error) {
                console.error("Error fetching members: ", error);
                toast({
                  variant: 'destructive',
                  title: 'Error fetching members',
                  description: 'Could not load group members. Please try again later.'
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchMembers();
    }, [firestore, memberIds, toast]);

    const handleStatusChange = async (memberId: string, status: UserStatus) => {
        if (currentUser?.uid !== memberId) {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'You can only change your own status.' });
            return;
        }

        const userDocRef = doc(firestore, 'users', memberId);
        try {
            await updateDoc(userDocRef, { status });
            setMembers(prevMembers => prevMembers.map(m => m.id === memberId ? { ...m, status } : m));
            toast({ title: 'Status Updated', description: `Your status is now ${status}.`});
        } catch (error: any) {
            console.error("Error updating status:", error);
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
    };

    if (isLoading) {
        return <p>Loading members...</p>;
    }

    if (!members || members.length === 0) {
        return <p className="text-muted-foreground text-sm">This group doesn't have any members yet.</p>;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {members.map(member => {
                const derivedStatus = getDerivedUserStatus(member);
                return (
                 <div key={member.id} className="flex flex-col items-center text-center gap-2 p-2 rounded-lg hover:bg-accent relative">
                     <Link href={`/users/${member.id}`} className="w-full">
                        <Avatar className="mx-auto">
                            <AvatarImage src={member.profilePictureUrl} />
                            <AvatarFallback>{member.username?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium truncate w-full mt-2">{member.username}</p>
                    </Link>

                    <div className="flex items-center gap-2 text-xs capitalize">
                        <span className={cn("h-2 w-2 rounded-full", statusColors[derivedStatus])}></span>
                        {derivedStatus}
                    </div>

                    {currentUser?.uid === member.id && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="absolute top-0 right-0 h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'active')}>Set Active</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'paused')}>Set Paused</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'inactive')}>Set Inactive</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            )})}
        </div>
    );
}
