
'use client';
import { useState, useMemo, useEffect } from 'react';
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
import { topics, commitmentLevels, ONE_WEEK_IN_MS } from '@/lib/constants';
import { collection, query, where, Query, Timestamp } from 'firebase/firestore';
import { StudyGroup } from '@/lib/types';
import JoinGroupButton from '../JoinGroupButton';
import Link from 'next/link';
import { Input } from '../ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter, DrawerDescription } from '@/components/ui/drawer';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NameSearchInput from '../NameSearchInput';


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
  const [availableGroups, setAvailableGroups] = useState<StudyGroup[]>([]);

  const finalTopic = topic === 'Other' ? customTopic : topic;

  const matchingGroupsQuery = useMemo(() => {
    if (step !== 2 || !finalTopic || !commitment) return null;
    
    const oneWeekAgo = new Date(Date.now() - ONE_WEEK_IN_MS);
    const commitmentValue = commitmentLevels[commitment as keyof typeof commitmentLevels];

    return query(
      collection(firestore, 'studyGroups'),
      where('topic', '==', finalTopic),
      where('commitment', '==', commitmentValue),
      where('createdAt', '>', Timestamp.fromDate(oneWeekAgo))
    ) as Query<StudyGroup>;
  }, [step, finalTopic, commitment, firestore]);

  const { data: matchingGroups, isLoading } = useCollection<StudyGroup>(matchingGroupsQuery);

  useEffect(() => {
    if (user && matchingGroups) {
      const filtered = matchingGroups.filter(g => g.memberIds.length < 25 && !g.memberIds.includes(user.uid));
      setAvailableGroups(filtered);
    }
  }, [matchingGroups, user]);

  const handleFindGroups = () => {
    if (!finalTopic || !commitment) return;
    setStep(2);
  };
  
  const handleClose = () => {
    setStep(1);
    setTopic('');
    setCustomTopic('');
    setCommitment('part-time');
    setAvailableGroups([]);
    onClose();
  }

  const handleJoinSuccess = (groupId: string) => {
    handleClose();
    router.push(`/studygroups/${groupId}`);
  };

  const findButtonDisabled = !finalTopic || !commitment || (topic === 'Other' && !customTopic);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
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
          <div className="grid gap-4 py-4">
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
                       <DrawerDescription>Choose the primary focus for the study group.</DrawerDescription>
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
                <NameSearchInput
                  value={customTopic}
                  onChange={setCustomTopic}
                  onSelect={setCustomTopic}
                  collectionPath="studyGroups"
                  placeholder="Search for a topic or group name"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Time Commitment</Label>
              <RadioGroup defaultValue="part-time" onValueChange={setCommitment} value={commitment}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="casual" id="casual-modal-group" />
                  <Label htmlFor="casual-modal-group">{commitmentLevels['casual']}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="part-time" id="part-time-modal-group" />
                  <Label htmlFor="part-time-modal-group">{commitmentLevels['part-time']}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="formal" id="formal-modal-group" />
                  <Label htmlFor="formal-modal-group">{commitmentLevels['formal']}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full-time" id="full-time-modal-group" />
                  <Label htmlFor="full-time-modal-group">{commitmentLevels['full-time']}</Label>
                </div>
              </RadioGroup>
            </div>
            <Button onClick={handleFindGroups} disabled={findButtonDisabled}>
              Find Groups
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {isLoading && <p>Searching for groups...</p>}
            {!isLoading && availableGroups.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Matching Groups</h4>
                {availableGroups.map(group => (
                  <div key={group.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div>
                      <p className="font-semibold">{group.name}</p>
                      <p className="text-sm text-muted-foreground">{group.memberIds.length} / 25 members</p>
                    </div>
                    <JoinGroupButton group={group} onJoinSuccess={handleJoinSuccess} />
                  </div>
                ))}
              </div>
            )}
             {!isLoading && availableGroups.length === 0 && (
                <div className="text-center py-4 space-y-2">
                    <p className="text-muted-foreground">No matching open groups were found.</p>
                    <Button asChild onClick={handleClose}>
                        <Link href="/studygroups/create">Create a New Group</Link>
                    </Button>
                </div>
            )}
            <Button variant="outline" onClick={() => setStep(1)} className="w-full">Back</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
