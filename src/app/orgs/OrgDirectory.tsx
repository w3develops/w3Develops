'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, doc, getDoc, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { Building2, Plus, Users } from 'lucide-react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useVerifiedGuard } from '@/lib/hooks/useVerifiedGuard';
import { findBlockedWord } from '@/lib/member-posts';
import { MAX_ORG_ABOUT, MAX_ORG_NAME, MAX_ORG_TAGLINE, ORG_KINDS, ORG_SLUG_PATTERN, slugify, type OrgKind } from '@/lib/organizations';
import type { Organization } from '@/lib/types';

function CreateOrgDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [kind, setKind] = useState<OrgKind>('community');
  const [tagline, setTagline] = useState('');
  const [about, setAbout] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const address = slugEdited ? slug : slugify(name);

  const create = async () => {
    if (!user) return;
    const blocked = findBlockedWord(`${name} ${tagline} ${about}`);
    if (name.trim().length < 2 || !ORG_SLUG_PATTERN.test(address) || blocked) {
      toast({ variant: 'destructive', title: "Can't create that yet", description: blocked ? `Pages can't include “${blocked}”.` : 'Add a name and a page address of 3 to 40 letters, numbers and dashes.' });
      return;
    }
    setIsSaving(true);
    try {
      if ((await getDoc(doc(firestore, 'organizations', address))).exists()) {
        toast({ variant: 'destructive', title: 'That address is taken', description: 'Pick a different page address.' });
        return;
      }
      await setDoc(doc(firestore, 'organizations', address), {
        name: name.trim(), kind, tagline: tagline.trim(), about: about.trim(), website: '', location: '',
        ownerId: user.uid, adminIds: [user.uid], memberIds: [user.uid], createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      router.push(`/orgs/${address}`);
    } catch {
      toast({ variant: 'destructive', title: "Couldn't create the page", description: 'That address may be reserved. Try another.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={next => { if (!next) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create an organization page</DialogTitle>
          <DialogDescription>For your business, nonprofit, community or team. You can add details and members after.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label htmlFor="org-name">Name</Label>
            <Input id="org-name" value={name} onChange={e => setName(e.target.value)} maxLength={MAX_ORG_NAME} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="org-slug">Page address</Label>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>w3develops.org/orgs/</span>
              <Input id="org-slug" value={address} onChange={e => { setSlugEdited(true); setSlug(e.target.value.toLowerCase()); }} maxLength={40} />
            </div>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="org-kind">Kind</Label>
            <Select value={kind} onValueChange={value => setKind(value as OrgKind)}>
              <SelectTrigger id="org-kind"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(ORG_KINDS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="org-tagline">Tagline</Label>
            <Input id="org-tagline" value={tagline} onChange={e => setTagline(e.target.value)} maxLength={MAX_ORG_TAGLINE} placeholder="What you do, in a line" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="org-about">About</Label>
            <Textarea id="org-about" value={about} onChange={e => setAbout(e.target.value)} maxLength={MAX_ORG_ABOUT} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={create} disabled={isSaving}>{isSaving ? 'Creating...' : 'Create page'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** All organization pages; `initial` is the server's copy, shown until the live list loads */
export default function OrgDirectory({ initial }: { initial: unknown[] | null }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const ensureVerified = useVerifiedGuard();
  const [kind, setKind] = useState<OrgKind | null>(null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const orgsQuery = useMemo(() => query(collection(firestore, 'organizations'), orderBy('createdAt', 'desc'), limit(200)), [firestore]);
  const { data: orgs } = useCollection<Organization>(orgsQuery, initial);
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = (orgs ?? []).filter(org => (!kind || org.kind === kind)
    && words.every(word => `${org.name} ${org.tagline} ${org.location}`.toLowerCase().includes(word)));

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-headline">Organizations</h1>
          <p className="text-muted-foreground">Businesses, nonprofits, communities and teams run by w3Develops members.</p>
        </div>
        {user
          ? <Button onClick={() => { if (ensureVerified()) setCreating(true); }}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Create a page</Button>
          : <Button asChild><Link href="/login?redirect=/orgs">Sign in to create a page</Link></Button>}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search organizations" aria-label="Search organizations" className="sm:max-w-sm" />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Kind">
          <Button size="sm" variant={kind === null ? 'default' : 'outline'} aria-pressed={kind === null} onClick={() => setKind(null)}>All</Button>
          {(Object.entries(ORG_KINDS) as [OrgKind, string][]).map(([value, label]) => (
            <Button key={value} size="sm" variant={kind === value ? 'default' : 'outline'} aria-pressed={kind === value} onClick={() => setKind(value)}>{label}</Button>
          ))}
        </div>
      </div>
      {orgs && shown.length === 0 && <p className="text-muted-foreground">{orgs.length === 0 ? 'No organizations yet. Create the first one!' : 'No organizations match that search.'}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map(org => (
          <Card key={org.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Building2 className="h-5 w-5" aria-hidden="true" /></div>
                <div className="min-w-0">
                  <Link href={`/orgs/${org.id}`} className="font-semibold hover:underline">{org.name}</Link>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{ORG_KINDS[org.kind] ?? org.kind}</Badge>
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" aria-hidden="true" />{org.memberIds?.length ?? 0}</span>
                  </div>
                </div>
              </div>
              {org.tagline && <p className="text-sm text-muted-foreground">{org.tagline}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <CreateOrgDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
