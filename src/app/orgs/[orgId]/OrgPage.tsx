'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { ArrowLeft, Building2, ExternalLink, MapPin } from 'lucide-react';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import ReportUserButton from '@/components/ReportUserButton';
import ModeratorItemControls from '@/components/moderation/ModeratorItemControls';
import { useDocsByIds } from '@/lib/hooks/useDocsByIds';
import { useVerifiedGuard } from '@/lib/hooks/useVerifiedGuard';
import { findBlockedWord } from '@/lib/member-posts';
import { MAX_ORG_ABOUT, MAX_ORG_ADMINS, MAX_ORG_LOCATION, MAX_ORG_NAME, MAX_ORG_TAGLINE, ORG_KINDS } from '@/lib/organizations';
import type { OrgJoinRequest, Organization, UserProfile } from '@/lib/types';

/** Editing the page's details, for admins */
function EditDetails({ org, onDone }: { org: Organization; onDone: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: org.name, tagline: org.tagline, about: org.about, website: org.website, location: org.location });
  const set = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [field]: event.target.value });

  const save = async () => {
    const blocked = findBlockedWord(`${form.name} ${form.tagline} ${form.about}`);
    if (form.name.trim().length < 2 || blocked || (form.website.trim() && !/^https:\/\/\S+$/.test(form.website.trim()))) {
      toast({ variant: 'destructive', title: "Can't save that", description: blocked ? `Pages can't include “${blocked}”.` : 'Check the name and that the website starts with https://' });
      return;
    }
    try {
      await updateDoc(doc(firestore, 'organizations', org.id), {
        name: form.name.trim(), tagline: form.tagline.trim(), about: form.about.trim(), website: form.website.trim(), location: form.location.trim(), updatedAt: serverTimestamp(),
      });
      onDone();
    } catch {
      toast({ variant: 'destructive', title: "Couldn't save the page" });
    }
  };

  return (
    <Card>
      <CardContent className="grid gap-3 p-4">
        <div className="grid gap-1"><Label htmlFor="edit-org-name">Name</Label><Input id="edit-org-name" value={form.name} onChange={set('name')} maxLength={MAX_ORG_NAME} /></div>
        <div className="grid gap-1"><Label htmlFor="edit-org-tagline">Tagline</Label><Input id="edit-org-tagline" value={form.tagline} onChange={set('tagline')} maxLength={MAX_ORG_TAGLINE} /></div>
        <div className="grid gap-1"><Label htmlFor="edit-org-about">About</Label><Textarea id="edit-org-about" value={form.about} onChange={set('about')} maxLength={MAX_ORG_ABOUT} rows={5} /></div>
        <div className="grid gap-1"><Label htmlFor="edit-org-website">Website</Label><Input id="edit-org-website" value={form.website} onChange={set('website')} placeholder="https://..." /></div>
        <div className="grid gap-1"><Label htmlFor="edit-org-location">Location</Label><Input id="edit-org-location" value={form.location} onChange={set('location')} maxLength={MAX_ORG_LOCATION} placeholder="Remote, or a city" /></div>
        <div className="flex gap-2"><Button onClick={save}>Save</Button><Button variant="outline" onClick={onDone}>Cancel</Button></div>
      </CardContent>
    </Card>
  );
}

/** People asking to join, for admins */
function JoinRequests({ org }: { org: Organization }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const requestsRef = useMemo(() => collection(firestore, 'organizations', org.id, 'joinRequests'), [firestore, org.id]);
  const { data: requests } = useCollection<OrgJoinRequest>(requestsRef);
  if (!requests || requests.length === 0) return null;

  const answer = async (request: OrgJoinRequest, accept: boolean) => {
    try {
      const batch = writeBatch(firestore);
      if (accept) batch.update(doc(firestore, 'organizations', org.id), { memberIds: arrayUnion(request.id), updatedAt: serverTimestamp() });
      batch.delete(doc(firestore, 'organizations', org.id, 'joinRequests', request.id));
      await batch.commit();
    } catch {
      toast({ variant: 'destructive', title: "Couldn't do that", description: 'Please try again.' });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Requests to join ({requests.length})</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {requests.map(request => (
          <div key={request.id} className="flex flex-wrap items-center gap-2 text-sm">
            <Link href={`/users/${request.id}`} className="font-medium hover:underline">{request.name}</Link>
            {request.note && <span className="text-muted-foreground">“{request.note}”</span>}
            <span className="ml-auto flex gap-1">
              <Button size="sm" onClick={() => answer(request, true)}>Accept</Button>
              <Button size="sm" variant="ghost" onClick={() => answer(request, false)}>Decline</Button>
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** One organization's page; `initial` is the server's copy */
export default function OrgPage({ orgId, initial }: { orgId: string; initial: Record<string, unknown> | null }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const ensureVerified = useVerifiedGuard();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState('');
  const orgRef = useMemo(() => doc(firestore, 'organizations', orgId), [firestore, orgId]);
  const { data: org, isLoading } = useDoc<Organization>(orgRef, initial);
  const requestRef = useMemo(() => (user ? doc(firestore, 'organizations', orgId, 'joinRequests', user.uid) : null), [firestore, orgId, user]);
  const { data: myRequest } = useDoc<OrgJoinRequest>(requestRef);
  const { data: members } = useDocsByIds<UserProfile>('users', org?.memberIds ?? []);

  if (!org) {
    return <div className="max-w-3xl mx-auto p-4 md:p-10 text-muted-foreground">{isLoading ? 'Loading...' : 'This organization doesn’t exist or was removed.'}</div>;
  }

  const isMember = !!user && org.memberIds.includes(user.uid);
  const isAdmin = !!user && org.adminIds.includes(user.uid);
  const isOwner = user?.uid === org.ownerId;

  const run = async (action: () => Promise<unknown>, done: string) => {
    try {
      await action();
      toast({ title: done });
    } catch {
      toast({ variant: 'destructive', title: 'Something went wrong', description: 'Please try again.' });
    }
  };

  const askToJoin = () => run(async () => {
    const me = (await getDoc(doc(firestore, 'users', user!.uid))).data();
    await setDoc(requestRef!, { name: me?.username ?? '', photo: me?.profilePictureUrl ?? '', note: note.trim(), createdAt: serverTimestamp() });
  }, 'Request sent');

  const setMember = (memberId: string, change: 'remove' | 'admin' | 'unadmin') => run(() => updateDoc(orgRef, change === 'remove'
    ? { memberIds: arrayRemove(memberId), adminIds: arrayRemove(memberId), updatedAt: serverTimestamp() }
    : { adminIds: change === 'admin' ? arrayUnion(memberId) : arrayRemove(memberId), updatedAt: serverTimestamp() }), 'Saved');

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-6">
      <Link href="/orgs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Organizations</Link>
      {editing ? <EditDetails org={org} onDone={() => setEditing(false)} /> : (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="h-7 w-7" aria-hidden="true" /></div>
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-headline">{org.name}</h1>
                {org.tagline && <p className="text-muted-foreground">{org.tagline}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="secondary">{ORG_KINDS[org.kind] ?? org.kind}</Badge>
                  {org.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{org.location}</span>}
                  {org.website && <a href={org.website} target="_blank" rel="nofollow ugc noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3 w-3" aria-hidden="true" />Website</a>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {isAdmin && <Button variant="outline" onClick={() => setEditing(true)}>Edit page</Button>}
                {isMember && !isAdmin && <Button variant="outline" onClick={() => run(() => updateDoc(orgRef, { memberIds: arrayRemove(user!.uid) }), 'You left')}>Leave</Button>}
                {isOwner && <Button variant="ghost" className="text-destructive" onClick={() => { if (window.confirm('Delete this page for everyone?')) run(() => deleteDoc(orgRef), 'Page deleted'); }}>Delete</Button>}
                {user && !isOwner && <ReportUserButton reportedUserId={org.ownerId} username={org.name} />}
              </div>
            </div>
            {org.about && <p className="whitespace-pre-wrap">{org.about}</p>}
            {user && !isMember && (myRequest ? (
              <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">You asked to join.</span><Button size="sm" variant="ghost" onClick={() => run(() => deleteDoc(requestRef!), 'Request cancelled')}>Cancel request</Button></div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input value={note} onChange={e => setNote(e.target.value)} maxLength={300} placeholder="A note to the admins (optional)" aria-label="Note to the admins" />
                <Button onClick={() => { if (ensureVerified()) askToJoin(); }}>Ask to join</Button>
              </div>
            ))}
            {!user && <p className="text-sm"><Link href={`/login?redirect=/orgs/${org.id}`} className="text-primary underline">Sign in</Link> to join.</p>}
            <ModeratorItemControls kind="organizations" id={org.id} item={org as unknown as Record<string, unknown>} />
          </CardContent>
        </Card>
      )}

      {isAdmin && <JoinRequests org={org} />}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Members ({org.memberIds.length})</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {org.memberIds.map(memberId => {
            const member = members?.find(m => m.id === memberId);
            return (
              <div key={memberId} className="flex items-center gap-2 text-sm">
                <Avatar className="h-7 w-7"><AvatarImage src={member?.profilePictureUrl || undefined} alt="" /><AvatarFallback>{(member?.username ?? '?').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                <Link href={`/users/${memberId}`} className="hover:underline">{member?.username ?? 'A member'}</Link>
                {memberId === org.ownerId ? <Badge variant="outline">Owner</Badge> : org.adminIds.includes(memberId) && <Badge variant="outline">Admin</Badge>}
                {isAdmin && memberId !== org.ownerId && (
                  <span className="ml-auto flex gap-1">
                    {isOwner && (org.adminIds.includes(memberId)
                      ? <Button size="sm" variant="ghost" onClick={() => setMember(memberId, 'unadmin')}>Remove admin</Button>
                      : org.adminIds.length < MAX_ORG_ADMINS && <Button size="sm" variant="ghost" onClick={() => setMember(memberId, 'admin')}>Make admin</Button>)}
                    {(isOwner || !org.adminIds.includes(memberId)) && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setMember(memberId, 'remove')}>Remove</Button>}
                  </span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
