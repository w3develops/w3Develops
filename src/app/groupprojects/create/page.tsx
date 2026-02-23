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

export default function CreateGroupProjectPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userDocRef = useMemo(() => user ? doc(firestore, 'users', user.uid) as DocumentReference<UserProfile> : null, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(userDocRef);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
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

  const handleCreateGroupProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !profile) {
        toast({ variant: "destructive", title: "Not Authenticated" });
        return;
    }
    
    const finalTopic = topic === 'Other' ? customTopic : topic;
    const finalCommitment = commitmentOption === 'custom' ? `${customCommitment}hr/day` : `${commitmentOption}hr/day`;

    if (!name || !finalTopic || !finalCommitment || commitmentDays.length === 0 || !localStartTime) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all required fields." });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const startTimeUTC = normalizeToUTC(localStartTime, profile.utcOffset);

      const batch = writeBatch(firestore);
      const newGroupProjectRef = doc(collection(firestore, 'groupProjects'));

      batch.set(newGroupProjectRef, {
        name: name,
        name_lowercase: name.toLowerCase(),
        topic: finalTopic,
        commitment: finalCommitment,
        commitmentDays: commitmentDays,
        startTimeUTC: startTimeUTC,
        githubUrl: githubUrl,
        description: description || `A new group project for ${finalTopic}`,
        creatorId: user.uid,
        memberIds: [user.uid],
        createdAt: serverTimestamp(),
      });
      
      const userProfileRef = doc(firestore, 'users', user.uid);
      batch.update(userProfileRef, {
        createdGroupProjectIds: arrayUnion(newGroupProjectRef.id)
      });
      
      await batch.commit();

      toast({ title: "Success!", description: "Your new group project has been created." });
      router.push(`/groupprojects/${newGroupProjectRef.id}`);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Could Not Create Project", description: error.message || "An unexpected error occurred." });
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
          <CardTitle>Create a New Group Project</CardTitle>
          <CardDescription>
            Start a new group project to build an application with other developers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateGroupProject} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <NameSearchInput
                value={name}
                onChange={setName}
                onSelect={setName}
                collectionPath="groupProjects"
                placeholder="My Awesome Project"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="topic">Topic / Technology</Label>
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
                      <DrawerDescription>Choose the primary technology for your project.</DrawerDescription>
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
                <p className="text-[10px] text-muted-foreground">This helps members coordinate across time zones. We will convert it automatically for others.</p>
            </div>
            
            <div className="grid gap-2">
                <Label>Time Commitment (Hours per day)</Label>
                <RadioGroup value={commitmentOption} onValueChange={setCommitmentOption}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="2" id="h2-gp" /><Label htmlFor="h2-gp">2 hours</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="4" id="h4-gp" /><Label htmlFor="h4-gp">4 hours</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="8" id="h8-gp" /><Label htmlFor="h8-gp">8 hours</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="h-custom-gp" /><Label htmlFor="h-custom-gp">Custom</Label></div>
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
              <Label htmlFor="githubUrl">GitHub URL (Optional)</Label>
              <Input id="githubUrl" placeholder="https://github.com/user/repo" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} maxLength={150} />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" placeholder="A brief description of your project." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Group Project'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}