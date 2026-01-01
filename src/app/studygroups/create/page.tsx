
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
import { topics, commitmentLevels, ONE_WEEK_IN_MS } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter, DrawerDescription } from '@/components/ui/drawer';
import { ChevronDown } from 'lucide-react';


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
  const [commitment, setCommitment] = useState('part-time');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
        toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to create a group." });
        router.push('/login');
        return;
    }
    const finalTopic = topic === 'Other' ? customTopic : topic;
    const finalCommitment = commitmentLevels[commitment as keyof typeof commitmentLevels];
    
    if (!name || !finalTopic || !commitment) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all required fields." });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
        // Check for existing, non-full, recent groups
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
            return; // Stop the creation process
        }

        // If no suitable group, proceed to create
        const batch = writeBatch(firestore);
        const newGroupRef = doc(collection(firestore, 'studyGroups'));

        batch.set(newGroupRef, {
            name: name,
            name_lowercase: name.toLowerCase(),
            topic: finalTopic,
            commitment: finalCommitment,
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
              <Input id="name" placeholder="e.g., React Rangers" value={name} onChange={(e) => setName(e.target.value)} required maxLength={75} />
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
                <Label>Time Commitment</Label>
                <RadioGroup defaultValue="part-time" onValueChange={setCommitment} value={commitment}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="part-time" id="part-time" />
                        <Label htmlFor="part-time">{commitmentLevels['part-time']}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full-time" id="full-time" />
                        <Label htmlFor="full-time">{commitmentLevels['full-time']}</Label>
                    </div>
                </RadioGroup>
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
