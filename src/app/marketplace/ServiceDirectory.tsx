'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, deleteDoc, doc, getDoc, limit, orderBy, query, serverTimestamp, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { ExternalLink, Plus } from 'lucide-react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import ReportUserButton from '@/components/ReportUserButton';
import ModeratorItemControls from '@/components/moderation/ModeratorItemControls';
import { useVerifiedGuard } from '@/lib/hooks/useVerifiedGuard';
import { findBlockedWord } from '@/lib/member-posts';
import {
  MAX_LISTINGS_PER_MEMBER, MAX_SERVICE_DESCRIPTION, MAX_SERVICE_PRICE, MAX_SERVICE_SKILLS, MAX_SERVICE_TITLE,
  SERVICE_CATEGORIES, type ServiceCategory,
} from '@/lib/services';
import type { ServiceListing } from '@/lib/types';

const ALL = 'all';

interface Draft {
  title: string;
  description: string;
  category: ServiceCategory;
  skills: string;
  priceNote: string;
  contactUrl: string;
}

const EMPTY: Draft = { title: '', description: '', category: 'websites', skills: '', priceNote: '', contactUrl: '' };

function parseSkills(input: string): string[] {
  const skills = input.split(',').map(skill => skill.trim().toLowerCase()).filter(skill => /^[a-z0-9.+# -]{1,30}$/.test(skill));
  return [...new Set(skills)].slice(0, MAX_SERVICE_SKILLS);
}

function draftProblem(draft: Draft): string | null {
  if (!draft.title.trim()) return 'Give your service a title.';
  if (!draft.description.trim()) return 'Describe what you offer.';
  if (draft.contactUrl.trim() && !/^https:\/\/\S+$/.test(draft.contactUrl.trim())) return 'The link must start with https://';
  const blocked = findBlockedWord(`${draft.title} ${draft.description}`);
  if (blocked) return `Listings can't include “${blocked}”.`;
  return null;
}

/** Creates or edits one of the signed-in member's listings */
function ListingDialog({ open, onClose, editing, freeSlot }: { open: boolean; onClose: () => void; editing: ServiceListing | null; freeSlot: number | null }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Fill the form when it opens for a listing (or empty for a new one)
  const key = open ? editing?.id ?? 'new' : null;
  if (key !== loadedFor) {
    setLoadedFor(key);
    setDraft(editing
      ? { title: editing.title, description: editing.description, category: editing.category, skills: editing.skills.join(', '), priceNote: editing.priceNote, contactUrl: editing.contactUrl ?? '' }
      : EMPTY);
  }

  const save = async () => {
    if (!user) return;
    const problem = draftProblem(draft);
    if (problem) {
      toast({ variant: 'destructive', title: "Can't save that yet", description: problem });
      return;
    }
    setIsSaving(true);
    try {
      const fields = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        category: draft.category,
        skills: parseSkills(draft.skills),
        priceNote: draft.priceNote.trim(),
        updatedAt: serverTimestamp(),
      };
      const contactUrl = draft.contactUrl.trim();
      if (editing) {
        await updateDoc(doc(firestore, 'serviceListings', editing.id), { ...fields, contactUrl: contactUrl || deleteField() });
      } else if (freeSlot !== null) {
        const me = (await getDoc(doc(firestore, 'users', user.uid))).data();
        await setDoc(doc(firestore, 'serviceListings', `${user.uid}_${freeSlot}`), {
          ...fields,
          ...(contactUrl && { contactUrl }),
          ownerId: user.uid,
          ownerName: me?.username ?? '',
          ownerPhoto: me?.profilePictureUrl ?? '',
          createdAt: serverTimestamp(),
        });
      }
      toast({ title: editing ? 'Listing saved' : 'Your service is listed' });
      onClose();
    } catch {
      toast({ variant: 'destructive', title: "Couldn't save the listing", description: 'Please check the fields and try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const set = (field: keyof Draft) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft({ ...draft, [field]: event.target.value });

  return (
    <Dialog open={open} onOpenChange={next => { if (!next) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit your listing' : 'Offer a service'}</DialogTitle>
          <DialogDescription>Listing is free. People contact you through your profile or your link; w3Develops doesn&apos;t handle payments.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label htmlFor="service-title">Title</Label>
            <Input id="service-title" value={draft.title} onChange={set('title')} maxLength={MAX_SERVICE_TITLE} placeholder="I build fast portfolio websites" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="service-category">Category</Label>
            <Select value={draft.category} onValueChange={value => setDraft({ ...draft, category: value as ServiceCategory })}>
              <SelectTrigger id="service-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SERVICE_CATEGORIES).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="service-description">What you offer</Label>
            <Textarea id="service-description" value={draft.description} onChange={set('description')} maxLength={MAX_SERVICE_DESCRIPTION} rows={5}
              placeholder="What you do, for whom, how long it usually takes." />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="service-skills">Skills (comma-separated, up to {MAX_SERVICE_SKILLS})</Label>
            <Input id="service-skills" value={draft.skills} onChange={set('skills')} placeholder="react, next.js, tailwind" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="service-price">Price (optional)</Label>
            <Input id="service-price" value={draft.priceNote} onChange={set('priceNote')} maxLength={MAX_SERVICE_PRICE} placeholder="From $200, or free for nonprofits" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="service-link">Portfolio or booking link (optional)</Label>
            <Input id="service-link" value={draft.contactUrl} onChange={set('contactUrl')} placeholder="https://..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={save} disabled={isSaving}>{isSaving ? 'Saving...' : editing ? 'Save' : 'List my service'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ListingCard({ listing, onEdit }: { listing: ServiceListing; onEdit: (listing: ServiceListing) => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const isOwner = user?.uid === listing.ownerId;

  const remove = async () => {
    if (!window.confirm('Remove this listing?')) return;
    try {
      await deleteDoc(doc(firestore, 'serviceListings', listing.id));
      toast({ title: 'Listing removed' });
    } catch {
      toast({ variant: 'destructive', title: "Couldn't remove the listing" });
    }
  };

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold leading-snug">{listing.title}</h2>
          <Badge variant="secondary" className="shrink-0">{SERVICE_CATEGORIES[listing.category] ?? listing.category}</Badge>
        </div>
        <Link href={`/users/${listing.ownerId}`} className="flex items-center gap-2 text-sm hover:underline w-fit">
          <Avatar className="h-6 w-6">
            <AvatarImage src={listing.ownerPhoto || undefined} alt="" />
            <AvatarFallback>{listing.ownerName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {listing.ownerName}
        </Link>
        <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{listing.description}</p>
        {listing.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">{listing.skills.map(skill => <Badge key={skill} variant="outline">{skill}</Badge>)}</div>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <span className="text-sm font-medium">{listing.priceNote || 'Ask for a price'}</span>
          <div className="flex flex-wrap items-center gap-1">
            <Button asChild size="sm" variant="outline"><Link href={`/users/${listing.ownerId}`}>Contact</Link></Button>
            {listing.contactUrl && (
              <Button asChild size="sm" variant="ghost">
                <a href={listing.contactUrl} target="_blank" rel="nofollow ugc noopener noreferrer"><ExternalLink className="mr-1 h-3 w-3" aria-hidden="true" />Link</a>
              </Button>
            )}
            {isOwner ? (
              <>
                <Button size="sm" variant="ghost" onClick={() => onEdit(listing)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={remove}>Remove</Button>
              </>
            ) : (
              <ReportUserButton reportedUserId={listing.ownerId} username={listing.ownerName} />
            )}
          </div>
        </div>
        <ModeratorItemControls kind="serviceListings" id={listing.id} item={listing as unknown as Record<string, unknown>} compact />
      </CardContent>
    </Card>
  );
}

/** The services directory; `initial` is the server's copy of the listings, shown until the live list loads */
export default function ServiceDirectory({ initial }: { initial: unknown[] | null }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const ensureVerified = useVerifiedGuard();
  const [category, setCategory] = useState<string>(ALL);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<{ editing: ServiceListing | null } | null>(null);

  const listingsQuery = useMemo(() => query(collection(firestore, 'serviceListings'), orderBy('updatedAt', 'desc'), limit(200)), [firestore]);
  const { data: listings, isLoading } = useCollection<ServiceListing>(listingsQuery, initial);

  const mine = (listings ?? []).filter(listing => listing.ownerId === user?.uid);
  const usedSlots = new Set(mine.map(listing => Number(listing.id.split('_').pop())));
  const freeSlot = Array.from({ length: MAX_LISTINGS_PER_MEMBER }, (_, i) => i + 1).find(slot => !usedSlots.has(slot)) ?? null;

  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = (listings ?? []).filter(listing => (category === ALL || listing.category === category)
    && words.every(word => `${listing.title} ${listing.description} ${listing.skills.join(' ')} ${listing.ownerName}`.toLowerCase().includes(word)));

  const offer = () => {
    if (!ensureVerified()) return;
    setDialog({ editing: null });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-headline">Services Directory</h1>
          <p className="text-muted-foreground max-w-2xl">
            Hire w3Develops members for websites, apps, design, marketing and more. Listing and browsing are free, and you
            contact members directly: w3Develops doesn&apos;t take a cut or handle payments.
          </p>
        </div>
        {user ? (
          <Button onClick={offer} disabled={freeSlot === null} title={freeSlot === null ? `You can list up to ${MAX_LISTINGS_PER_MEMBER} services` : undefined}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Offer a service
          </Button>
        ) : (
          <Button asChild><Link href="/login?redirect=/marketplace">Sign in to offer a service</Link></Button>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services or skills" aria-label="Search services" className="sm:max-w-sm" />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-64" aria-label="Category"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {Object.entries(SERVICE_CATEGORIES).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading && !listings && <p className="text-muted-foreground">Loading services...</p>}
      {listings && shown.length === 0 && (
        <p className="text-muted-foreground">
          {listings.length === 0 ? 'No services listed yet. Be the first to offer one!' : 'No services match that search.'}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map(listing => <ListingCard key={listing.id} listing={listing} onEdit={editing => setDialog({ editing })} />)}
      </div>

      <p className="text-xs text-muted-foreground">
        Agree on the work and the price with the member before starting, and follow our <Link href="/code-of-conduct" className="underline">Code of Conduct</Link>.
        w3Develops doesn&apos;t check listings or guarantee any work. Report a listing that looks wrong.
      </p>

      <ListingDialog open={!!dialog} onClose={() => setDialog(null)} editing={dialog?.editing ?? null} freeSlot={freeSlot} />
    </div>
  );
}
