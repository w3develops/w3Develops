'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser, useFirestore, useDoc } from '@/firebase';
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { collection, serverTimestamp, query, where, getDocs, doc, writeBatch, arrayUnion, Timestamp, DocumentReference } from 'firebase/firestore';
import { topics, ONE_WEEK_IN_MS } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter, DrawerDescription } from '@/components/ui/drawer';
import { ChevronDown, Clock } from 'lucide-react';
import NameSearchInput from '@/components/NameSearchInput';
import { Checkbox } from '@/components/ui/checkbox';
import { UserProfile } from '@/lib/types';
import { normalizeToUTC } from '@/lib/utils';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CreateBookClubPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userDocRef = useMemo(() => user ? doc(firestore, 'users', user.uid) as DocumentReference<UserProfile> : null, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(userDocRef);

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [description, setDescription] = useState('');
  const [commitmentHourOption, setCommitmentHourOption] = useState('2');
  const [customCommitmentHours, setCustomCommitmentHours] = useState('');
  const [commitmentDays, setCommitmentDays] = useState<string[]>([]);
  const [localStartTime, setLocalTime] = useState('18:00');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !profile) {
        toast({ variant: "destructive", title: "Not Authenticated" });
        return;
    }
    const finalTopic = topic === 'Other' ? customTopic : topic;
    const finalCommitmentHours = commitmentHourOption === 'custom' ? customCommitmentHours : commitmentHourOption;

    if (!name || !finalTopic || !finalCommitmentHours || commitmentDays.length === 0 || !localStartTime) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all required fields." });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
        const startTimeUTC = normalizeToUTC(localStartTime, profile.utcOffset);

        const batch = writeBatch(firestore);
        const newClubRef = doc(collection(firestore, 'bookClubs'));

        batch.set(newClubRef, {
            name: name,
            name_lowercase: name.toLowerCase(),
            topic: finalTopic,
            commitmentHours: finalCommitmentHours,
            commitmentDays: commitmentDays,
            startTimeUTC: startTimeUTC,
            description: description || `A new book club for ${finalTopic}`,
            creatorId: user.uid,
            memberIds: [user.uid],
            createdAt: serverTimestamp(),
        });
        
        const userProfileRef = doc(firestore, 'users', user.uid);
        batch.update(userProfileRef, {
            createdBookClubIds: arrayUnion(newClubRef.id)
        });

        await batch.commit();

        toast({ title: "Success!", description: "Your new book club has been created." });
        router.push(`/book-clubs/${newClubRef.id}`);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Could Not Create Club", description: error.message || "An unexpected error occurred." });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDayChange = (day: string, checked: boolean) => {
    if (checked) {
      setCommitmentDays(prev => [...prev, day]);
    } else {
      setCommitmentDays(prev => prev.filter(d => d !== day));
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="p-4 md:p-10">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Book Club</CardTitle>
          <CardDescription>
            Start a new club to read and discuss books with other community members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateClub} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Club Name</Label>
              <NameSearchInput
                value={name}
                onChange={setName}
                onSelect={setName}
                collectionPath="bookClubs"
                placeholder="e.g., Sci-Fi Readers"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="topic">Genre / Topic</Label>
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
                      <DrawerDescription>Choose the primary focus for your book club.</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                      {topics.map(t => (
                        <Button
                          key={t}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            setTopic(t);
                            setIsDrawerOpen(false);
                          }}
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
            </div>

            {topic === 'Other' && (
              <div className="grid gap-2">
                <Label htmlFor="customTopic">Custom Topic</Label>
                <Input id="customTopic" placeholder="Enter your custom topic" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} required maxLength={50} />
              </div>
            )}

            <div className="grid gap-2">
                <Label htmlFor="startTime" className="flex items-center gap-2"><Clock className="h-4 w-4" /> Preferred Meeting Time (In your local time)</Label>
                <Input id="startTime" type="time" value={localStartTime} onChange={e => setLocalTime(e.target.value)} required />
                <p className="text-[10px] text-muted-foreground">Times are stored in UTC to help global members find suitable slots.</p>
            </div>

            <div className="grid gap-2">
                <Label>Time Commitment (Hours per day)</Label>
                <RadioGroup value={commitmentHourOption} onValueChange={setCommitmentHourOption}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="1" id="h1" /><Label htmlFor="h1">1 hour</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="2" id="h2" /><Label htmlFor="h2">2 hours</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="3" id="h3" /><Label htmlFor="h3">3 hours</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="h-custom" /><Label htmlFor="h-custom">Custom</Label></div>
                </RadioGroup>
                {commitmentHourOption === 'custom' && (
                    <Input className="mt-2" type="number" placeholder="Enter hours per day" value={customCommitmentHours} onChange={(e) => setCustomCommitmentHours(e.target.value)} required min="1" />
                )}
            </div>
            
            <div className="grid gap-2">
                <Label>Meeting Days</Label>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {daysOfWeek.map(day => (
                        <div key={day} className="flex items-center gap-2">
                            <Checkbox id={`day-${day}`} onCheckedChange={(checked) => handleDayChange(day, !!checked)} />
                            <Label htmlFor={`day-${day}`}>{day}</Label>
                        </div>
                    ))}
                </div>
            </div>

             <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" placeholder="What's the main goal of this club?" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Club'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}