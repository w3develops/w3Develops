
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser, useFirestore } from '@/firebase';
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { collection, serverTimestamp, doc, writeBatch, arrayUnion, Timestamp } from 'firebase/firestore';
import { topics, timezones } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter, DrawerDescription } from '@/components/ui/drawer';
import { ChevronDown } from 'lucide-react';
import NameSearchInput from '@/components/NameSearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CreateMeetupPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [locationType, setLocationType] = useState<'Online' | 'In-Person' | 'Hybrid'>('Online');
  const [locationAddress, setLocationAddress] = useState('');
  const [virtualLink, setVirtualLink] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/meetups/create');
    }
  }, [user, isUserLoading, router]);

  const handleCreateMeetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
        toast({ variant: "destructive", title: "Not Authenticated" });
        return;
    }
    
    const finalTopic = topic === 'Other' ? customTopic : topic;

    if (!name || !finalTopic || !date || !time || !timezone || !locationType) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all required fields." });
      return;
    }

    if ((locationType === 'In-Person' || locationType === 'Hybrid') && !locationAddress) {
       toast({ variant: "destructive", title: "Missing Location", description: "Please provide an address for the in-person meetup." });
       return;
    }
    if ((locationType === 'Online' || locationType === 'Hybrid') && !virtualLink) {
       toast({ variant: "destructive", title: "Missing Link", description: "Please provide a link for the online meetup." });
       return;
    }

    setIsSubmitting(true);
    
    try {
      const dateTimeString = `${date}T${time}`;
      const dateTime = new Date(dateTimeString);

      const batch = writeBatch(firestore);
      const newMeetupRef = doc(collection(firestore, 'meetups'));

      batch.set(newMeetupRef, {
        name: name,
        name_lowercase: name.toLowerCase(),
        topic: finalTopic,
        description: description || `A meetup about ${finalTopic}.`,
        creatorId: user.uid,
        attendeeIds: [user.uid],
        dateTime: Timestamp.fromDate(dateTime),
        timezone,
        locationType,
        locationAddress: (locationType === 'In-Person' || locationType === 'Hybrid') ? locationAddress : '',
        virtualLink: (locationType === 'Online' || locationType === 'Hybrid') ? virtualLink : '',
        createdAt: serverTimestamp(),
      });
      
      const userProfileRef = doc(firestore, 'users', user.uid);
      batch.update(userProfileRef, {
        createdMeetupIds: arrayUnion(newMeetupRef.id)
      });
      
      await batch.commit();

      toast({ title: "Success!", description: "Your new meetup has been created." });
      router.push(`/meetups/${newMeetupRef.id}`);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Could Not Create Meetup", description: error.message || "An unexpected error occurred." });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isUserLoading || !user) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Meetup</CardTitle>
          <CardDescription>Organize an event for the community, online or in-person.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateMeetup} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Meetup Name</Label>
              <NameSearchInput
                value={name}
                onChange={setName}
                onSelect={setName}
                collectionPath="meetups"
                placeholder="e.g., Local React Coders"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="topic">Topic</Label>
               <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {topic || "Select a topic"}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Select a Topic</DrawerTitle>
                      <DrawerDescription>Choose the primary focus for your meetup.</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                      {topics.map(t => (
                        <Button key={t} variant="ghost" className="w-full justify-start" onClick={() => { setTopic(t); setIsDrawerOpen(false); }}>{t}</Button>
                      ))}
                    </div>
                    <DrawerFooter><DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose></DrawerFooter>
                  </DrawerContent>
                </Drawer>
            </div>
            {topic === 'Other' && (
              <div className="grid gap-2"><Label htmlFor="customTopic">Custom Topic</Label><Input id="customTopic" placeholder="Enter custom topic" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} required /></div>
            )}
             <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="date">Date</Label><Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
                <div className="grid gap-2"><Label htmlFor="time">Time</Label><Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} required /></div>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="timezone">Time Zone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger><SelectValue placeholder="Select a timezone" /></SelectTrigger>
                    <SelectContent>
                        {timezones.map(tz => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="grid gap-2">
                <Label>Location Type</Label>
                <RadioGroup value={locationType} onValueChange={(v: any) => setLocationType(v)} className="flex gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Online" id="loc-online" /><Label htmlFor="loc-online">Online</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="In-Person" id="loc-person" /><Label htmlFor="loc-person">In-Person</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Hybrid" id="loc-hybrid" /><Label htmlFor="loc-hybrid">Hybrid</Label></div>
                </RadioGroup>
            </div>
            {(locationType === 'In-Person' || locationType === 'Hybrid') && (
                <div className="grid gap-2"><Label htmlFor="locationAddress">Address</Label><Input id="locationAddress" placeholder="123 Main St, Anytown, USA" value={locationAddress} onChange={e => setLocationAddress(e.target.value)} required /></div>
            )}
            {(locationType === 'Online' || locationType === 'Hybrid') && (
                <div className="grid gap-2"><Label htmlFor="virtualLink">Virtual Meeting Link</Label><Input id="virtualLink" placeholder="https://zoom.us/j/..." value={virtualLink} onChange={e => setVirtualLink(e.target.value)} required /></div>
            )}
             <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" placeholder="Details about the event, agenda, speakers, etc." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Meetup'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
