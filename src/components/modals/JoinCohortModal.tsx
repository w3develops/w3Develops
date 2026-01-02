
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
import { GroupProject } from '@/lib/types';
import JoinCohortButton from '../JoinCohortButton';
import Link from 'next/link';
import { Input } from '../ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter, DrawerDescription } from '@/components/ui/drawer';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';


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
  const [commitment, setCommitment] = useState('part-time');
  const [step, setStep] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [availableGroupProjects, setAvailableGroupProjects] = useState<GroupProject[]>([]);

  const finalTopic = topic === 'Other' ? customTopic : topic;

  const matchingGroupProjectsQuery = useMemo(() => {
    if (step !== 2 || !finalTopic || !commitment) return null;
    
    const oneWeekAgo = new Date(Date.now() - ONE_WEEK_IN_MS);
    const commitmentValue = commitmentLevels[commitment as keyof typeof commitmentLevels];

    return query(
      collection(firestore, 'groupProjects'),
      where('topic', '==', finalTopic),
      where('commitment', '==', commitmentValue),
      where('createdAt', '>', Timestamp.fromDate(oneWeekAgo))
    ) as Query<GroupProject>;
  }, [step, finalTopic, commitment, firestore]);

  const { data: matchingGroupProjects, isLoading } = useCollection<GroupProject>(matchingGroupProjectsQuery);

  useEffect(() => {
    if (user && matchingGroupProjects) {
      const filtered = matchingGroupProjects.filter(c => c.memberIds.length < 25 && !c.memberIds.includes(user.uid));
      setAvailableGroupProjects(filtered);
    }
  }, [matchingGroupProjects, user]);


  const handleFindGroupProjects = () => {
    if (!finalTopic || !commitment) return;
    setStep(2);
  };
  
  const handleClose = () => {
    setStep(1);
    setTopic('');
    setCustomTopic('');
    setCommitment('part-time');
    setAvailableGroupProjects([]);
    onClose();
  }

  const handleJoinSuccess = (groupProjectId: string) => {
    handleClose();
    router.push(`/groupprojects/${groupProjectId}`);
  };
  
  const findButtonDisabled = !finalTopic || !commitment || (topic === 'Other' && !customTopic);

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
                <Input id="customTopic" placeholder="e.g., Svelte" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} required />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Time Commitment</Label>
              <RadioGroup defaultValue="part-time" onValueChange={setCommitment} value={commitment}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="part-time" id="part-time-modal" />
                  <Label htmlFor="part-time-modal">{commitmentLevels['part-time']}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full-time" id="full-time-modal" />
                  <Label htmlFor="full-time-modal">{commitmentLevels['full-time']}</Label>
                </div>
              </RadioGroup>
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
