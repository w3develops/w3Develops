
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
import { topics, ONE_WEEK_IN_MS } from '@/lib/constants';
import { collection, query, where, Query, Timestamp } from 'firebase/firestore';
import { GroupProject } from '@/lib/types';
import JoinCohortButton from '../JoinCohortButton';
import Link from 'next/link';
import { Input } from '../ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter, DrawerDescription } from '@/components/ui/drawer';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NameSearchInput from '../NameSearchInput';


interface JoinCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinCohortModal({ isOpen, onClose }: JoinCohortModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [commitmentOption, setCommitmentOption] = useState('4');
  const [customCommitment, setCustomCommitment] = useState('');
  const [step, setStep] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [availableGroupProjects, setAvailableGroupProjects] = useState<GroupProject[]>([]);

  const finalTopic = topic === 'Other' ? customTopic : topic;
  const finalCommitment = commitmentOption === 'custom' ? `${customCommitment}hr/day` : `${commitmentOption}hr/day`;

  const matchingGroupProjectsQuery = useMemo(() => {
    if (step !== 2 || !finalTopic || !finalCommitment) return null;
    
    const oneWeekAgo = new Date(Date.now() - ONE_WEEK_IN_MS);

    return query(
      collection(firestore, 'groupProjects'),
      where('topic', '==', finalTopic),
      where('commitment', '==', finalCommitment),
      where('createdAt', '>', Timestamp.fromDate(oneWeekAgo))
    ) as Query<GroupProject>;
  }, [step, finalTopic, finalCommitment, firestore]);

  const { data: matchingGroupProjects, isLoading } = useCollection<GroupProject>(matchingGroupProjectsQuery);

  useEffect(() => {
    if (user && matchingGroupProjects) {
      const filtered = matchingGroupProjects.filter(c => c.memberIds.length < 25 && !c.memberIds.includes(user.uid));
      setAvailableGroupProjects(filtered);
    }
  }, [matchingGroupProjects, user]);


  const handleFindGroupProjects = () => {
    if (!finalTopic || !finalCommitment) return;
    setStep(2);
  };
  
  const handleClose = () => {
    setStep(1);
    setTopic('');
    setCustomTopic('');
    setCommitmentOption('4');
    setCustomCommitment('');
    setAvailableGroupProjects([]);
    onClose();
  }

  const handleJoinSuccess = (groupProjectId: string) => {
    handleClose();
    router.push(`/groupprojects/${groupProjectId}`);
  };
  
  const findButtonDisabled = !finalTopic || !finalCommitment || (topic === 'Other' && !customTopic) || (commitmentOption === 'custom' && !customCommitment);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join a Group Project</DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Select your preferences to find matching projects."
              : "Here are projects that match your criteria. Join one or create a new one."
            }
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 && (
          <div className="grid gap-4 py-4">
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
                 <NameSearchInput
                  value={customTopic}
                  onChange={setCustomTopic}
                  onSelect={setCustomTopic}
                  collectionPath="groupProjects"
                  placeholder="Search for a topic or project name"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Time Commitment (Hours per day)</Label>
                <RadioGroup value={commitmentOption} onValueChange={setCommitmentOption}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="2" id="h2-gpm" /><Label htmlFor="h2-gpm">2 hours</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="4" id="h4-gpm" /><Label htmlFor="h4-gpm">4 hours</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="8" id="h8-gpm" /><Label htmlFor="h8-gpm">8 hours</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="h-custom-gpm" /><Label htmlFor="h-custom-gpm">Custom</Label></div>
                </RadioGroup>
                {commitmentOption === 'custom' && (
                    <Input className="mt-2" type="number" placeholder="Enter hours per day" value={customCommitment} onChange={(e) => setCustomCommitment(e.target.value)} required min="1" />
                )}
            </div>
            <Button onClick={handleFindGroupProjects} disabled={findButtonDisabled}>
              Find Projects
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {isLoading && <p>Searching for projects...</p>}
            {!isLoading && availableGroupProjects.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Matching Projects</h4>
                {availableGroupProjects.map(groupProject => (
                  <div key={groupProject.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div>
                      <p className="font-semibold">{groupProject.name}</p>
                      <p className="text-sm text-muted-foreground">{groupProject.memberIds.length} / 25 members</p>
                    </div>
                    <JoinCohortButton groupProject={groupProject} onJoinSuccess={handleJoinSuccess} />
                  </div>
                ))}
              </div>
            )}
             {!isLoading && availableGroupProjects.length === 0 && (
                <div className="text-center py-4 space-y-2">
                    <p className="text-muted-foreground">No matching open projects were found.</p>
                    <Button asChild onClick={handleClose}>
                        <Link href="/groupprojects/create">Create a New Project</Link>
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
