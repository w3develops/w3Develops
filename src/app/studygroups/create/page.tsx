
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
import { collection, serverTimestamp, query, where, getDocs, doc, writeBatch, arrayUnion, Timestamp } from 'firebase/firestore';
import { topics, ONE_WEEK_IN_MS } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter, DrawerDescription } from '@/components/ui/drawer';
import { ChevronDown } from 'lucide-react';
import NameSearchInput from '@/components/NameSearchInput';
import { Checkbox } from '@/components/ui/checkbox';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CreateGroupPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [description, setDescription] = useState('');
  const [commitmentOption, setCommitmentOption] = useState('4');
  const [customCommitment, setCustomCommitment] = useState('');
  const [commitmentDays, setCommitmentDays] = useState<string[]>([]);
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
    if (!user || !firestore) {
        toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to create a group." });
        router.push('/login');
        return;
    }
    const finalTopic = topic === 'Other' ? customTopic : topic;
    const finalCommitment = commitmentOption === 'custom' ? `${customCommitment}hr/day` : `${commitmentOption}hr/day`;
    
    if (!name || !finalTopic || !finalCommitment || commitmentDays.length === 0) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all required fields." });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
        const oneWeekAgoTimestamp = Date.now() - ONE_WEEK_IN_MS;
        const q = query(
            collection(firestore, 'studyGroups'),
            where('topic', '==', finalTopic),
            where('commitment', '==', finalCommitment)
        );
        const existingSnapshot = await getDocs(q);
        
        const suitableGroups = existingSnapshot.docs.filter(doc => {
            const data = doc.data();
            const createdAt = (data.createdAt as Timestamp).toMillis();
            return data.memberIds.length < 25 && createdAt > oneWeekAgoTimestamp;
        });


        if (suitableGroups.length > 0) {
            toast({
                variant: "destructive",
                title: "Similar Group Exists",
                description: "A similar group that is not full was found. Please join that one instead from the explore page!",
            });
            router.push('/studygroups');
            return;
        }

        const batch = writeBatch(firestore);
        const newGroupRef = doc(collection(firestore, 'studyGroups'));

        batch.set(newGroupRef, {
            name: name,
            name_lowercase: name.toLowerCase(),
            topic: finalTopic,
            commitment: finalCommitment,
            commitmentDays: commitmentDays,
            description: description || `A new group for ${finalTopic}`,
            creatorId: user.uid,
            memberIds: [user.uid],
            createdAt: serverTimestamp(),
        });
        
        const userProfileRef = doc(firestore, 'users', user.uid);
        batch.update(userProfileRef, {
            createdStudyGroupIds: arrayUnion(newGroupRef.id)
        });

        await batch.commit();

        toast({ title: "Success!", description: "Your new study group has been created." });
        router.push(`/studygroups/${newGroupRef.id}`);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Could Not Create Group", description: error.message || "An unexpected error occurred." });
    } finally {
        setIsSubmitting(false);
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
          <CardTitle>Create a New Study Group</CardTitle>
          <CardDescription>
            Start a new group to collaborate with other developers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateGroup} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name</Label>
              <NameSearchInput
                value={name}
                onChange={setName}
                onSelect={setName}
                collectionPath="studyGroups"
                placeholder="e.g., React Rangers"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="topic">Topic of Study</Label>
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
                      <DrawerDescription>Choose the primary focus for your study group.</DrawerDescription>
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
                <Label>Time Commitment (Hours per day)</Label>
                <RadioGroup value={commitmentOption} onValueChange={setCommitmentOption}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="2" id="h2-sg" /><Label htmlFor="h2-sg">2 hours</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="4" id="h4-sg" /><Label htmlFor="h4-sg">4 hours</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="8" id="h8-sg" /><Label htmlFor="h8-sg">8 hours</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="h-custom-sg" /><Label htmlFor="h-custom-sg">Custom</Label></div>
                </RadioGroup>
                {commitmentOption === 'custom' && (
                    <Input className="mt-2" type="number" placeholder="Enter hours per day" value={customCommitment} onChange={(e) => setCustomCommitment(e.target.value)} required min="1" />
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
              <Textarea id="description" placeholder="What's the main goal of this group?" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
