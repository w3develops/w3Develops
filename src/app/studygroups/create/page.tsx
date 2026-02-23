
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

export default function CreateGroupPage() {
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
  const [commitmentOption, setCommitmentOption] = useState('4');
  const [customCommitment, setCustomCommitment] = useState('');
  const [commitmentDays, setCommitmentDays] = useState<string[]>([]);
  const [localStartTime, setLocalTime] = useState('18:00');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleDayChange = (day: string, checked: boolean) => {
    if (checked) {
      setCommitmentDays(prev => [...prev, day]);
    } else {
      setCommitmentDays(prev => prev.filter(d => d !== day));
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !profile) {
        toast({ variant: "destructive", title: "Not Authenticated" });
        return;
    }
    const finalTopic = topic === 'Other' ? customTopic : topic;
    const finalCommitment = commitmentOption === 'custom' ? `${customCommitment}hr/day` : `${commitmentOption}hr/day`;
    
    if (!name || !finalTopic || !finalCommitment || commitmentDays.length === 0 || !localStartTime) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all fields including your preferred start time." });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
        const startTimeUTC = normalizeToUTC(localStartTime, profile.utcOffset);

        const batch = writeBatch(firestore);
        const newGroupRef = doc(collection(firestore, 'studyGroups'));

        batch.set(newGroupRef, {
            name: name,
            name_lowercase: name.toLowerCase(),
            topic: finalTopic,
            commitment: finalCommitment,
            commitmentDays: commitmentDays,
            startTimeUTC: startTimeUTC,
            description: description || `A new group for ${finalTopic}`,
            creatorId: user.uid,
            memberIds: [user.uid],
            createdAt: serverTimestamp(),
        });
        
        batch.update(doc(firestore, 'users', user.uid), {
            createdStudyGroupIds: arrayUnion(newGroupRef.id)
        });

        await batch.commit();
        toast({ title: "Success!", description: "Group created." });
        router.push(`/studygroups/${newGroupRef.id}`);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
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
          <CardTitle>Create a New Study Group</CardTitle>
          <CardDescription>Collaborate with others. Times will be converted automatically for members.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateGroup} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name</Label>
              <NameSearchInput value={name} onChange={setName} onSelect={setName} collectionPath="studyGroups" placeholder="e.g., React Rangers" />
            </div>
            
            <div className="grid gap-2">
              <Label>Topic</Label>
               <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {topic || "Select a topic"} <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Select a Topic</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                      {topics.map(t => (
                        <Button key={t} variant="ghost" className="w-full justify-start" onClick={() => { setTopic(t); setIsDrawerOpen(false); }}>{t}</Button>
                      ))}
                    </div>
                  </DrawerContent>
                </Drawer>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="startTime" className="flex items-center gap-2"><Clock className="h-4 w-4" /> Preferred Start Time (In your local time)</Label>
                <Input id="startTime" type="time" value={localStartTime} onChange={e => setLocalTime(e.target.value)} required />
                <p className="text-[10px] text-muted-foreground">This will be converted to UTC {profile?.utcOffset >= 0 ? '+' : ''}{profile?.utcOffset} for coordination.</p>
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
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Goal of this group?" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
            </div>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Group'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
