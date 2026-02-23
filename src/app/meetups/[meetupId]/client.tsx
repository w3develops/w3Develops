'use client';

import { useDoc, useCollection, useFirestore, useUser } from '@/firebase';
import { useMemo, useState, useEffect } from 'react';
import { doc, DocumentReference, collection, query, where, getDocs, Query, documentId, addDoc, serverTimestamp, orderBy, updateDoc } from 'firebase/firestore';
import { Meetup, MeetupUpdate, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, CalendarDays, ArrowLeft, MapPin, Video, User, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatTimestamp, convertUTCToLocal } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import TaskList from '@/components/TaskList';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import JoinMeetupButton from '@/components/JoinMeetupButton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

function MeetupUpdates({ meetupId, creatorId }: { meetupId: string, creatorId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const isCreator = user?.uid === creatorId;
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updatesCollectionRef = useMemo(() => 
    collection(firestore, 'meetups', meetupId, 'updates'), [firestore, meetupId]);
  
  const updatesQuery = useMemo(() => 
    query(updatesCollectionRef, orderBy('createdAt', 'desc')), [updatesCollectionRef]);

  const { data: updates, isLoading } = useCollection<MeetupUpdate>(updatesQuery);

  const handlePostUpdate = async () => {
    if (!isCreator || !content.trim()) return;
    setIsSubmitting(true);
    const updateData = {
        meetupId,
        creatorId,
        content,
        createdAt: serverTimestamp(),
    };
    addDoc(updatesCollectionRef, updateData)
        .then((newDoc) => {
            return updateDoc(newDoc, { id: newDoc.id });
        })
        .then(() => {
            setContent('');
            toast({ title: 'Update Posted' });
        })
        .catch(async (error) => {
            const permissionError = new FirestorePermissionError({ path: updatesCollectionRef.path, operation: 'create', requestResourceData: updateData });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not post update due to a permission issue.' });
        })
        .finally(() => {
            setIsSubmitting(false);
        });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Updates</CardTitle>
        <CardDescription>Announcements and updates for this meetup.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCreator && (
            <div className="space-y-2">
                <Textarea placeholder="Post an update for attendees..." value={content} onChange={e => setContent(e.target.value)} />
                <Button onClick={handlePostUpdate} disabled={isSubmitting || !content.trim()}>
                    {isSubmitting ? 'Posting...' : 'Post Update'}
                </Button>
            </div>
        )}
        <div className="space-y-4">
            {isLoading && <p>Loading updates...</p>}
            {updates && updates.length > 0 ? (
                updates.map(update => (
                    <div key={update.id} className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">{formatTimestamp(update.createdAt, true)}</p>
                        <p className="mt-1 whitespace-pre-wrap">{update.content}</p>
                    </div>
                ))
            ) : (
                !isLoading && <p className="text-sm text-center text-muted-foreground py-4">No updates have been posted yet.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

function AttendeeList({ attendeeIds }: { attendeeIds: string[] }) {
    const firestore = useFirestore();
    const [attendees, setAttendees] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAttendees = async () => {
            if (!attendeeIds || attendeeIds.length === 0) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const profilesQuery = query(collection(firestore, 'users'), where(documentId(), 'in', attendeeIds.slice(0, 30)));
                const snapshot = await getDocs(profilesQuery);
                const profileData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
                setAttendees(profileData);
            } catch (error) {
                console.error("Error fetching attendees: ", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAttendees();
    }, [firestore, attendeeIds]);

    if (isLoading) {
        return <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 w-16 bg-muted rounded-full animate-pulse" />)}
        </div>;
    }
    
    if (attendees.length === 0) {
        return <p className="text-sm text-muted-foreground">No attendees yet.</p>;
    }

    return (
        <div className="flex flex-wrap gap-4">
            {attendees.map(attendee => (
                <Link href={`/users/${attendee.id}`} key={attendee.id}>
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={attendee.profilePictureUrl} alt={attendee.username} />
                        <AvatarFallback>{attendee.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Link>
            ))}
        </div>
    )
}

export default function MeetupDashboardPage({ params }: { params: { meetupId: string } }) {
  const { meetupId } = params;
  const { user } = useUser();
  const firestore = useFirestore();

  const meetupDocRef = useMemo(() => doc(firestore, 'meetups', meetupId) as DocumentReference<Meetup>, [meetupId, firestore]);
  const userDocRef = useMemo(() => user ? doc(firestore, 'users', user.uid) as DocumentReference<UserProfile> : null, [user, firestore]);

  const { data: meetup, isLoading, error } = useDoc<Meetup>(meetupDocRef);
  const { data: currentUserProfile } = useDoc<UserProfile>(userDocRef);

  const creatorDocRef = useMemo(() => meetup ? doc(firestore, 'users', meetup.creatorId) as DocumentReference<UserProfile> : null, [meetup, firestore]);
  const { data: creator } = useDoc<UserProfile>(creatorDocRef);

  const isAttendee = user && meetup ? meetup.attendeeIds.includes(user.uid) : false;

  if (isLoading) return <div className="text-center py-10 p-4 md:p-10">Loading meetup...</div>;
  if (error) return <div className="text-center py-10 text-destructive p-4 md:p-10">Error loading meetup data.</div>;
  if (!meetup) return <div className="text-center py-10 p-4 md:p-10">Meetup not found.</div>;
  
  return (
    <div className="space-y-8 p-4 md:p-10">
        <Link href="/meetups" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Meetups
        </Link>
      
      <Card>
        <CardHeader>
            <div className="flex flex-wrap items-center gap-4">
                <CardTitle className="font-headline text-3xl">{meetup.name}</CardTitle>
                <Badge variant="secondary">{meetup.topic}</Badge>
            </div>
            <CardDescription>{meetup.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-start gap-3"><CalendarDays className="w-5 h-5 mt-1 flex-shrink-0" /><p>{formatTimestamp(meetup.dateTime, true)} ({meetup.timezone})</p></div>
                    {meetup.startTimeUTC && (
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 mt-1 flex-shrink-0 text-primary" />
                            <div>
                                <p className="font-semibold text-primary">
                                    {currentUserProfile 
                                        ? convertUTCToLocal(meetup.startTimeUTC, currentUserProfile.utcOffset)
                                        : `${meetup.startTimeUTC} UTC`
                                    }
                                </p>
                                <p className="text-xs text-muted-foreground">Calculated for your profile location.</p>
                            </div>
                        </div>
                    )}
                    {meetup.locationType !== 'Online' && <div className="flex items-start gap-3"><MapPin className="w-5 h-5 mt-1 flex-shrink-0" /><p>{meetup.locationAddress}</p></div>}
                    {meetup.locationType !== 'In-Person' && <div className="flex items-start gap-3"><Video className="w-5 h-5 mt-1 flex-shrink-0" /><a href={meetup.virtualLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{meetup.virtualLink}</a></div>}
                    {creator && <div className="flex items-start gap-3"><User className="w-5 h-5 mt-1 flex-shrink-0" /><p>Hosted by <Link href={`/users/${creator.id}`} className="font-semibold hover:underline">{creator.username}</Link></p></div>}
                </div>
                <div className="flex justify-end items-start"><JoinMeetupButton meetup={meetup} /></div>
           </div>
        </CardContent>
      </Card>
      
      {isAttendee && <TaskList groupOrCohortId={meetupId} collectionPath="meetups" memberIds={meetup.attendeeIds} />}

      <MeetupUpdates meetupId={meetupId} creatorId={meetup.creatorId} />

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Attendees ({meetup.attendeeIds.length})</CardTitle>
        </CardHeader>
        <CardContent>
            <AttendeeList attendeeIds={meetup.attendeeIds} />
        </CardContent>
      </Card>
    </div>
  );
}