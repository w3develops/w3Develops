'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Timestamp, collection, deleteDoc, doc, limit, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { ArrowLeft, Flag, Send } from 'lucide-react';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useDocsByIds } from '@/lib/hooks/useDocsByIds';
import { useVerifiedGuard } from '@/lib/hooks/useVerifiedGuard';
import { useNow } from '@/lib/hooks/useClientValues';
import { findBlockedWord } from '@/lib/member-posts';
import { MAX_MESSAGE_LENGTH, MESSAGE_MIN_AGE, conversationIdFor, isAdultAt } from '@/lib/messages';
import type { Conversation, DirectMessage, UserProfile } from '@/lib/types';

/** Asks once for the member's birth date; it can't be changed afterwards */
function AgeCheck() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [birthDate, setBirthDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    if (!user || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return;
    if (!window.confirm('Is this your real birth date? You can’t change it later.')) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, 'ages', user.uid), { birthDate: Timestamp.fromDate(new Date(`${birthDate}T00:00:00Z`)), confirmedAt: serverTimestamp() });
    } catch {
      toast({ variant: 'destructive', title: "Couldn't save that", description: 'Please check the date.' });
      setIsSaving(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardContent className="space-y-3 p-6">
        <h2 className="text-lg font-semibold">Messages are for members {MESSAGE_MIN_AGE} and over</h2>
        <p className="text-sm text-muted-foreground">
          Enter your birth date to use messages. It&apos;s private: only you can see it, and it&apos;s used only to check your age.
          You can&apos;t change it later.
        </p>
        <div className="grid gap-1">
          <Label htmlFor="birth-date">Birth date</Label>
          <Input id="birth-date" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
        </div>
        <Button onClick={save} disabled={isSaving || !birthDate}>Continue</Button>
      </CardContent>
    </Card>
  );
}

function MessageBubble({ message, mine, conversationId, otherName }: { message: DirectMessage; mine: boolean; conversationId: string; otherName: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const report = async () => {
    if (!user || !window.confirm(`Report this message from ${otherName} to the moderators? They'll see only this message.`)) return;
    try {
      await setDoc(doc(firestore, 'reports', `${message.id}_${user.uid}`), {
        reporterId: user.uid, reportedUserId: message.senderId, conversationId, messageId: message.id, messageText: message.text,
        reason: 'harassment', details: '', page: '/messages', status: 'open', createdAt: serverTimestamp(),
      });
      toast({ title: 'Reported', description: 'Thank you. A moderator will look at it. You can also block them from the feed.' });
    } catch {
      toast({ variant: 'destructive', title: "Couldn't send the report", description: 'You may have reported it already.' });
    }
  };

  return (
    <div className={`group flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
      </div>
      <div className="flex items-end opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {mine ? (
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => deleteDoc(doc(firestore, 'conversations', conversationId, 'messages', message.id))}>Delete</Button>
        ) : (
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={report} aria-label="Report this message"><Flag className="h-3 w-3" /></Button>
        )}
      </div>
    </div>
  );
}

/** One conversation, or a new one with `otherId` that starts with the first message */
function Thread({ otherId, other, conversation }: { otherId: string; other: UserProfile | undefined; conversation: Conversation | undefined }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const ensureVerified = useVerifiedGuard();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const conversationId = user ? conversationIdFor(user.uid, otherId) : '';
  const messagesQuery = useMemo(
    () => (conversation ? query(collection(firestore, 'conversations', conversation.id, 'messages'), orderBy('createdAt', 'asc'), limit(200)) : null),
    [firestore, conversation],
  );
  const { data: messages } = useCollection<DirectMessage>(messagesQuery);
  const name = other?.username ?? 'this member';

  // Mark it read when it's open and something new arrives
  const lastMessageMillis = conversation?.lastMessageAt?.toMillis?.() ?? 0;
  const readMillis = (user && conversation?.readAt?.[user.uid]?.toMillis?.()) ?? 0;
  useEffect(() => {
    if (user && conversation && lastMessageMillis > readMillis) {
      updateDoc(doc(firestore, 'conversations', conversation.id), { [`readAt.${user.uid}`]: serverTimestamp() }).catch(() => {});
    }
  }, [firestore, user, conversation, lastMessageMillis, readMillis]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [messages?.length]);

  const send = async () => {
    const trimmed = text.trim();
    if (!user || !trimmed || !ensureVerified()) return;
    const blocked = findBlockedWord(trimmed);
    if (blocked) {
      toast({ variant: 'destructive', title: "Can't send that", description: `Messages can't include “${blocked}”.` });
      return;
    }
    setIsSending(true);
    try {
      const conversationRef = doc(firestore, 'conversations', conversationId);
      const batch = writeBatch(firestore);
      const preview = { lastMessageAt: serverTimestamp(), lastMessageText: trimmed.slice(0, 140), lastSenderId: user.uid };
      if (conversation) batch.update(conversationRef, preview);
      else batch.set(conversationRef, { memberIds: [user.uid, otherId].sort(), createdAt: serverTimestamp(), ...preview });
      batch.set(doc(collection(conversationRef, 'messages')), { senderId: user.uid, text: trimmed, createdAt: serverTimestamp() });
      await batch.commit();
      setText('');
    } catch {
      toast({
        variant: 'destructive', title: "Couldn't send",
        description: `Messages are only between members ${MESSAGE_MIN_AGE} and over who haven't blocked each other, and not while posting is paused.`,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="flex h-[70vh] flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <Link href="/messages" className="md:hidden" aria-label="Back to conversations"><ArrowLeft className="h-4 w-4" /></Link>
        <Avatar className="h-8 w-8"><AvatarImage src={other?.profilePictureUrl || undefined} alt="" /><AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
        <Link href={`/users/${otherId}`} className="font-semibold hover:underline">{name}</Link>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {!conversation && <p className="text-center text-sm text-muted-foreground">Say hello to {name}. Be kind and follow the Code of Conduct.</p>}
        {messages?.map(message => (
          <MessageBubble key={message.id} message={message} mine={message.senderId === user?.uid} conversationId={conversationId} otherName={name} />
        ))}
        <div ref={bottom} />
      </div>
      <form className="flex items-end gap-2 border-t p-3" onSubmit={e => { e.preventDefault(); send(); }}>
        <Textarea value={text} onChange={e => setText(e.target.value)} maxLength={MAX_MESSAGE_LENGTH} rows={1} placeholder={`Message ${name}`} aria-label={`Message ${name}`}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} className="min-h-10" />
        <Button type="submit" size="icon" disabled={isSending || !text.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
      </form>
    </Card>
  );
}

/** Direct messages between members 18 and over. ?with=<uid> opens (or starts) a conversation. */
export default function Messages() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const otherId = useSearchParams().get('with');
  const now = useNow();

  const ageRef = useMemo(() => (user ? doc(firestore, 'ages', user.uid) : null), [firestore, user]);
  const { data: age, isLoading: ageLoading } = useDoc<{ birthDate: Timestamp }>(ageRef);
  const isAdult = !!age?.birthDate && now !== null && isAdultAt(age.birthDate.toMillis(), now);

  const conversationsQuery = useMemo(
    () => (user && isAdult ? query(collection(firestore, 'conversations'), where('memberIds', 'array-contains', user.uid), orderBy('lastMessageAt', 'desc'), limit(100)) : null),
    [firestore, user, isAdult],
  );
  const { data: conversations } = useCollection<Conversation>(conversationsQuery);
  const otherIds = useMemo(() => {
    const ids = new Set((conversations ?? []).map(c => c.memberIds.find(id => id !== user?.uid)!).filter(Boolean));
    if (otherId) ids.add(otherId);
    return [...ids];
  }, [conversations, otherId, user?.uid]);
  const { data: people } = useDocsByIds<UserProfile>('users', otherIds);
  const person = (id: string) => people?.find(p => p.id === id);

  if (isUserLoading || (user && (ageLoading || now === null))) return <div className="p-10 text-muted-foreground">Loading...</div>;
  if (!user) {
    return <div className="max-w-3xl mx-auto p-4 md:p-10"><Link href="/login?redirect=/messages" className="text-primary underline">Sign in</Link> to see your messages.</div>;
  }

  const current = otherId && otherId !== user.uid ? otherId : null;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-4">
      <h1 className="text-3xl font-headline">Messages</h1>
      {!age ? <AgeCheck /> : !isAdult ? (
        <p className="text-muted-foreground">
          Messages are for members {MESSAGE_MIN_AGE} and over. You can still join groups, post on the <Link href="/feed" className="underline">community feed</Link> and reply to posts.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <Card className={current ? 'hidden md:block' : ''}>
            <CardContent className="p-2">
              {conversations?.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">No conversations yet. Open a member&apos;s profile and select <strong>Message</strong>.</p>
              )}
              <ul>
                {conversations?.map(conversation => {
                  const id = conversation.memberIds.find(member => member !== user.uid)!;
                  const p = person(id);
                  const unread = conversation.lastSenderId !== user.uid
                    && (conversation.lastMessageAt?.toMillis?.() ?? 0) > (conversation.readAt?.[user.uid]?.toMillis?.() ?? 0);
                  return (
                    <li key={conversation.id}>
                      <button type="button" onClick={() => router.push(`/messages?with=${id}`)}
                        className={`flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-accent ${id === current ? 'bg-accent' : ''}`}>
                        <Avatar className="h-8 w-8"><AvatarImage src={p?.profilePictureUrl || undefined} alt="" /><AvatarFallback>{(p?.username ?? '?').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm ${unread ? 'font-bold' : 'font-medium'}`}>{p?.username ?? 'A member'}</span>
                          <span className="block truncate text-xs text-muted-foreground">{conversation.lastSenderId === user.uid ? 'You: ' : ''}{conversation.lastMessageText}</span>
                        </span>
                        {unread && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
          {current ? (
            <Thread key={current} otherId={current} other={person(current)} conversation={conversations?.find(c => c.memberIds.includes(current))} />
          ) : (
            <Card className="hidden md:flex md:items-center md:justify-center"><p className="p-10 text-muted-foreground">Pick a conversation.</p></Card>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Messages are private between the two of you. Report a message to show it, and only it, to the moderators. Block someone from the{' '}
        <Link href="/feed" className="underline">feed</Link> to stop their messages.
      </p>
    </div>
  );
}
