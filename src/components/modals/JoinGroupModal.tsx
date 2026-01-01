
'use client';
import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { topics, commitmentLevels } from '@/lib/constants';
import { collection, query, where, Query } from 'firebase/firestore';
import { StudyGroup } from '@/lib/types';
import JoinGroupButton from '../JoinGroupButton';
import Link from 'next/link';
import { Input } from '../ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter, DrawerDescription } from '@/components/ui/drawer';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';


interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinGroupModal({ isOpen, onClose }: JoinGroupModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [commitment, setCommitment] = useState('part-time');
  const [step, setStep] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const finalTopic = topic === 'Other' ? customTopic : topic;

  const matchingGroupsQuery = useMemo(() => {
    if (step !== 2 || !finalTopic || !commitment || !user) return null;
    
    return query(
      collection(firestore, 'studyGroups'),
      where('topic', '==', finalTopic),
      where('commitment', '==', commitmentLevels[commitment as keyof typeof commitmentLevels])
    ) as Query;
  }, [step, finalTopic, commitment, firestore, user]);

  const { data: matchingGroups, isLoading } = useCollection<StudyGroup>(matchingGroupsQuery);

  const handleFindGroups = () => {
    if (!finalTopic || !commitment) return;
    setStep(2);
  };
  
  const handleClose = () => {
    setStep(1);
    setTopic('');
    setCustomTopic('');
    setCommitment('part-time');
    onClose();
  }

  const handleJoinSuccess = (groupId: string) => {
    handleClose();
    router.push(`/studygroups/${groupId}`);
  };

  const availableGroups = useMemo(() => {
    return matchingGroups?.filter(g => g.memberIds.length < 25 && !g.memberIds.includes(user?.uid || '')) || [];
  }, [matchingGroups, user]);

  const findButtonDisabled = !finalTopic || !commitment || (topic === 'Other' && !customTopic);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join a Study Group</DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Select your preferences to find matching groups."
              : "Here are groups that match your criteria. Join one or create a new one."
            }
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 && (
          <div class="grid gap-4 py-4">
            <div class="grid gap-2">
              <Label htmlFor="topic">Topic of Study</Label>
               <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="outline" class="w-full justify-between">
                      {topic || "Select a topic"}
                      <ChevronDown class="h-4 w-4" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Select a Topic</DrawerTitle>
                       <DrawerDescription>Choose the primary focus for the study group.</DrawerDescription>
                    </DrawerHeader>
                    <div class="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                      {topics.map(t => (
                        <Button
                          key={t}
                          variant="ghost"
                          class="w-full justify-start"
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
              <div class="grid gap-2">
                <Label htmlFor="customTopic">Custom Topic</Label>
                <Input id="customTopic" placeholder="e.g., Svelte" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} required />
              </div>
            )}
            <div class="grid gap-2">
              <Label>Time Commitment</Label>
              <RadioGroup defaultValue="part-time" onValueChange={setCommitment} value={commitment}>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="part-time" id="part-time-modal" />
                  <Label htmlFor="part-time-modal">{commitmentLevels['part-time']}</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="full-time" id="full-time-modal" />
                  <Label htmlFor="full-time-modal">{commitmentLevels['full-time']}</Label>
                </div>
              </RadioGroup>
            </div>
            <Button onClick={handleFindGroups} disabled={findButtonDisabled}>
              Find Groups
            </Button>
          </div>
        )}

        {step === 2 && (
          <div class="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {isLoading && <p>Searching for groups...</p>}
            {!isLoading && availableGroups.length > 0 && (
              <div class="space-y-2">
                <h4 class="font-semibold">Matching Groups</h4>
                {availableGroups.map(group => (
                  <div key={group.id} class="flex items-center justify-between p-2 border rounded-md">
                    <div>
                      <p class="font-semibold">{group.name}</p>
                      <p class="text-sm text-muted-foreground">{group.memberIds.length} / 25 members</p>
                    </div>
                    <JoinGroupButton group={group} onJoinSuccess={handleJoinSuccess} />
                  </div>
                ))}
              </div>
            )}
             {!isLoading && availableGroups.length === 0 && (
                <div class="text-center py-4 space-y-2">
                    <p class="text-muted-foreground">No matching open groups were found.</p>
                    <Button asChild onClick={handleClose}>
                        <Link href="/studygroups/create">Create a New Group</Link>
                    </Button>
                </div>
            )}
            <Button variant="outline" onClick={() => setStep(1)} class="w-full">Back</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
