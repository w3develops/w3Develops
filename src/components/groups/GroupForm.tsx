'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, doc, DocumentReference, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ChevronDown, Clock } from 'lucide-react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import NameSearchInput from '@/components/NameSearchInput';
import TimezoneSelect from '@/components/TimezoneSelect';
import { topics } from '@/lib/constants';
import { Group, UserProfile } from '@/lib/types';
import { GROUP_KINDS, GroupKind, MAX_MEMBERS, commitmentLabel } from '@/lib/groups';
import { DAYS_OF_WEEK, browserTimeZone, describeSchedule, isValidTimeZone } from '@/lib/timezones';
import { useBrowserTimeZone } from '@/lib/hooks/useClientValues';
import { useVerifiedGuard } from '@/lib/hooks/useVerifiedGuard';
import { notifySearchEngines } from '@/lib/notify-search-engines';

const KEEP = 'keep';
const CUSTOM = 'custom';

/** Creates a group, or edits one when `groupId` is given (creators only) */
export default function GroupForm({ kind, groupId }: { kind: GroupKind; groupId?: string }) {
  const config = GROUP_KINDS[kind];
  const isEditing = !!groupId;
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const ensureVerified = useVerifiedGuard();

  const profileRef = useMemo(() => user ? doc(firestore, 'users', user.uid) as DocumentReference<UserProfile> : null, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

  const [existing, setExisting] = useState<Group | null>(null);
  const [isLoaded, setIsLoaded] = useState(!isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [description, setDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [openToJoinAnytime, setOpenToJoinAnytime] = useState(false);
  const [hourOption, setHourOption] = useState<string>(config.hourOptions[1]);
  const [customHours, setCustomHours] = useState('');
  const [days, setDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('18:00');
  // New groups default to the member's saved timezone, else the browser's;
  // editing loads the group's own timezone below
  const [chosenTimezone, setTimezone] = useState<string | null>(null);
  const browserTz = useBrowserTimeZone();
  const defaultTimezone = isEditing ? '' : isValidTimeZone(profile?.timezone) ? profile.timezone : browserTz;
  const timezone = chosenTimezone ?? defaultTimezone;

  useEffect(() => {
    if (!isUserLoading && !user) router.push(`/login?redirect=${encodeURIComponent(config.path + '/create')}`);
  }, [user, isUserLoading, router, config.path]);

  useEffect(() => {
    if (!groupId) return;
    getDoc(doc(firestore, config.collection, groupId)).then(snap => {
      if (snap.exists()) {
        const g = { id: snap.id, ...snap.data() } as Group;
        setExisting(g);
        setName(g.name);
        if (topics.includes(g.topic)) setTopic(g.topic); else { setTopic('Other'); setCustomTopic(g.topic); }
        setDescription(g.description || '');
        setGithubUrl(g.githubUrl || '');
        setOpenToJoinAnytime(!!g.openToJoinAnytime);
        const hours = commitmentLabel(g).match(/^(\d+)hr\/day$/)?.[1];
        if (!commitmentLabel(g)) setHourOption(config.hourOptions[1]);
        else if (hours && (config.hourOptions as readonly string[]).includes(hours)) setHourOption(hours);
        else if (hours) { setHourOption(CUSTOM); setCustomHours(hours); }
        else setHourOption(KEEP);
        setDays(g.commitmentDays || []);
        setStartTime(g.startTime || '18:00');
        setTimezone(isValidTimeZone(g.timezone) ? g.timezone : browserTimeZone());
      }
      setIsLoaded(true);
    });
  }, [groupId, firestore, config.collection, config.hourOptions]);

  const finalTopic = topic === 'Other' ? customTopic.trim() : topic;
  const commitment = hourOption === KEEP ? commitmentLabel(existing!) : `${hourOption === CUSTOM ? customHours : hourOption}hr/day`;
  const toggleDay = (day: string, checked: boolean) =>
    setDays(prev => checked ? DAYS_OF_WEEK.filter(d => d === day || prev.includes(d)) : prev.filter(d => d !== day));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim() || !finalTopic || days.length === 0 || !startTime || !timezone || (hourOption === CUSTOM && !customHours)) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill in the name, topic, hours, meeting days and time.' });
      return;
    }
    if (!ensureVerified()) return;
    setIsSubmitting(true);

    const fields = {
      name: name.trim(),
      name_lowercase: name.trim().toLowerCase(),
      topic: finalTopic,
      description: description.trim() || `A new ${config.title.toLowerCase()} for ${finalTopic}`,
      commitment,
      commitmentDays: days,
      startTime,
      timezone,
      ...(config.hasGithub ? { githubUrl: githubUrl.trim() } : {}),
      ...(config.canStayOpen ? { openToJoinAnytime } : {}),
    };

    try {
      if (isEditing) {
        await updateDoc(doc(firestore, config.collection, groupId), fields);
        toast({ title: 'Saved', description: `Your ${config.noun} has been updated.` });
        notifySearchEngines(`${config.path}/${groupId}`);
        router.push(`${config.path}/${groupId}`);
      } else {
        const ref = await addDoc(collection(firestore, config.collection), {
          ...fields,
          creatorId: user.uid,
          memberIds: [user.uid],
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Success!', description: `Your ${config.title.toLowerCase()} has been created.` });
        notifySearchEngines(`${config.path}/${ref.id}`);
        router.push(`${config.path}/${ref.id}`);
      }
    } catch {
      toast({ variant: 'destructive', title: `Could not save the ${config.noun}`, description: 'Please check the fields and try again.' });
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || !user || !isLoaded) {
    return <div className="p-4 md:p-10"><LoadingSkeleton /></div>;
  }
  if (isEditing && (!existing || existing.creatorId !== user.uid)) {
    return <div className="text-center py-10 p-4 md:p-10">Only the person who created this {config.noun} can edit it.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? `Edit ${config.title}` : `Create a New ${config.title}`}</CardTitle>
          <CardDescription>Members see the meeting time in their own timezone.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">{config.label} Name</Label>
              {isEditing ? (
                <Input id="name" value={name} onChange={e => setName(e.target.value)} maxLength={75} required />
              ) : (
                <NameSearchInput value={name} onChange={setName} onSelect={setName} collectionPath={config.collection} placeholder={config.namePlaceholder} />
              )}
            </div>

            <div className="grid gap-2">
              <Label>{config.topicLabel}</Label>
              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between">
                    {topic || 'Select a topic'} <ChevronDown className="h-4 w-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader><DrawerTitle>Select a Topic</DrawerTitle></DrawerHeader>
                  <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                    {topics.map(t => (
                      <Button key={t} type="button" variant="ghost" className="w-full justify-start" onClick={() => { setTopic(t); setIsDrawerOpen(false); }}>{t}</Button>
                    ))}
                  </div>
                  <DrawerFooter><DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose></DrawerFooter>
                </DrawerContent>
              </Drawer>
              {topic === 'Other' && (
                <Input placeholder="Enter your topic" value={customTopic} onChange={e => setCustomTopic(e.target.value)} maxLength={50} required />
              )}
            </div>

            <div className="grid gap-2">
              <Label>Time Commitment (hours per day)</Label>
              <RadioGroup value={hourOption} onValueChange={setHourOption}>
                {config.hourOptions.map(h => (
                  <div key={h} className="flex items-center space-x-2"><RadioGroupItem value={h} id={`h-${h}`} /><Label htmlFor={`h-${h}`}>{h} hour{h === '1' ? '' : 's'}</Label></div>
                ))}
                {hourOption === KEEP && existing && (
                  <div className="flex items-center space-x-2"><RadioGroupItem value={KEEP} id="h-keep" /><Label htmlFor="h-keep">{commitmentLabel(existing)}</Label></div>
                )}
                <div className="flex items-center space-x-2"><RadioGroupItem value={CUSTOM} id="h-custom" /><Label htmlFor="h-custom">Custom</Label></div>
              </RadioGroup>
              {hourOption === CUSTOM && (
                <Input type="number" placeholder="Hours per day" value={customHours} onChange={e => setCustomHours(e.target.value)} min="1" max="24" required />
              )}
            </div>

            <div className="grid gap-2">
              <Label>Meeting Days</Label>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="flex items-center gap-2">
                    <Checkbox id={`day-${day}`} checked={days.includes(day)} onCheckedChange={checked => toggleDay(day, !!checked)} />
                    <Label htmlFor={`day-${day}`}>{day}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="startTime" className="flex items-center gap-2"><Clock className="h-4 w-4" /> Start Time</Label>
                <Input id="startTime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <TimezoneSelect id="timezone" value={timezone} onChange={setTimezone} />
              </div>
            </div>
            {days.length > 0 && startTime && timezone && (
              <p className="text-xs text-muted-foreground -mt-4">
                Meets {describeSchedule(days, startTime, timezone, timezone)}. Members elsewhere see it in their own time
                (compare zones with the <Link href="/time-converter" target="_blank" className="text-primary underline">time converter</Link>).
              </p>
            )}

            {config.hasGithub && (
              <div className="grid gap-2">
                <Label htmlFor="githubUrl">GitHub Repository (optional)</Label>
                <Input id="githubUrl" type="url" placeholder="https://github.com/your/repo" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} />
              </div>
            )}

            {config.canStayOpen && (
              <div className="flex items-start gap-3 rounded-md border p-3">
                <Checkbox id="openToJoinAnytime" checked={openToJoinAnytime} onCheckedChange={checked => setOpenToJoinAnytime(!!checked)} className="mt-0.5" />
                <div className="grid gap-1">
                  <Label htmlFor="openToJoinAnytime">Open to join anytime</Label>
                  <p className="text-xs text-muted-foreground">
                    New members can join after the first week too, up to {MAX_MEMBERS} members. Leave it off to read together as a fixed group.
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder={`What's the goal of this ${config.noun}?`} value={description} onChange={e => setDescription(e.target.value)} maxLength={500} />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : `Create ${config.label}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
