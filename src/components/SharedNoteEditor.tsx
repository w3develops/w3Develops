
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp, DocumentReference, type Timestamp, type FieldValue } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { timeAgo } from '@/lib/utils';
import { UserProfile } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

interface SharedNote {
  id: string;
  content: string;
  lastUpdatedBy: string;
  lastUpdatedAt: Timestamp | FieldValue;
}

interface SharedNoteEditorProps {
  collectionPath: 'mentorships' | 'tutorships' | 'pairings';
  sessionId: string;
}

export default function SharedNoteEditor({ collectionPath, sessionId }: SharedNoteEditorProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const noteRef = useMemo(() => 
    doc(firestore, collectionPath, sessionId, 'notes', '_shared_note_') as DocumentReference<SharedNote>,
    [firestore, collectionPath, sessionId]
  );

  const { data: note, isLoading: isNoteLoading } = useDoc<SharedNote>(noteRef);
  const lastEditorId = note?.lastUpdatedBy;
  const lastEditorRef = useMemo(
    () => lastEditorId ? doc(firestore, 'users', lastEditorId) as DocumentReference<UserProfile> : null,
    [firestore, lastEditorId]
  );
  const { data: lastEditorProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(lastEditorRef);

  const [content, setContent] = useState('');
  const debouncedContent = useDebounce(content, 1000); // Save after 1s of inactivity

  // Each time Firestore sends the note, show its text if it differs from ours
  const [seenNote, setSeenNote] = useState<{ note: typeof note; isLoading: boolean } | null>(null);
  if (!seenNote || seenNote.note !== note || seenNote.isLoading !== isNoteLoading) {
    setSeenNote({ note, isLoading: isNoteLoading });
    if (note && note.content !== content) {
      setContent(note.content);
    } else if (!note && !isNoteLoading) {
      setContent('');
    }
  }

  // Save debounced content to firestore
  useEffect(() => {
    if (!user || isNoteLoading) return;
    
    // Don't save if content hasn't changed from what's in the DB
    if (note?.content === debouncedContent) return;

    // Don't save initial empty state before user types
    if (note === null && debouncedContent === '') return;

    const dataToSet = {
        content: debouncedContent,
        lastUpdatedBy: user.uid,
        lastUpdatedAt: serverTimestamp(),
        id: '_shared_note_'
    };
    
    setDoc(noteRef, dataToSet, { merge: true })
      .catch((error) => {
        console.error("Error saving note:", error);
        toast({
          variant: 'destructive',
          title: 'Error Saving Note',
          description: 'Your changes could not be saved.'
        });
      });
      
  }, [debouncedContent, noteRef, user, note, isNoteLoading, toast]);


  if (isNoteLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded"></div>
        <div className="h-32 bg-muted rounded"></div>
        <div className="h-4 w-64 bg-muted rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Shared Notes</h3>
        <p className="text-sm text-muted-foreground">
          These notes are shared in real-time with your partner.
        </p>
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing your shared notes here..."
        rows={15}
        className="w-full"
      />
      {note && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Last updated {note.lastUpdatedAt ? timeAgo(note.lastUpdatedAt) : 'just now'} by</span>
          {isProfileLoading ? (
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          ) : lastEditorProfile ? (
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={lastEditorProfile.profilePictureUrl} />
                            <AvatarFallback>{lastEditorProfile.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{lastEditorProfile.username}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
          ) : (
            'someone'
          )}
        </div>
      )}
    </div>
  );
}
