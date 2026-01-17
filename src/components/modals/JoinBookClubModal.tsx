
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
import { BookClub } from '@/lib/types';
import JoinBookClubButton from '../JoinBookClubButton';
import Link from 'next/link';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter, DrawerDescription } from '@/components/ui/drawer';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NameSearchInput from '../NameSearchInput';
import { Input } from '../ui/input';


interface JoinBookClubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinBookClubModal({ isOpen, onClose }: JoinBookClubModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [commitmentHourOption, setCommitmentHourOption] = useState('1');
  const [customCommitmentHours, setCustomCommitmentHours] = useState('');
  const [step, setStep] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [availableClubs, setAvailableClubs] = useState<BookClub[]>([]);

  const finalTopic = topic === 'Other' ? customTopic : topic;

  const finalCommitmentHours = useMemo(() => {
      return commitmentHourOption === 'custom' ? customCommitmentHours : commitmentHourOption;
  }, [commitmentHourOption, customCommitmentHours]);

  const matchingClubsQuery = useMemo(() => {
    if (step !== 2 || !finalTopic || !finalCommitmentHours) return null;
    
    const oneWeekAgo = new Date(Date.now() - ONE_WEEK_IN_MS);

    return query(
      collection(firestore, 'bookClubs'),
      where('topic', '==', finalTopic),
      where('commitmentHours', '==', finalCommitmentHours),
      where('createdAt', '>', Timestamp.fromDate(oneWeekAgo))
    ) as Query<BookClub>;
  }, [step, finalTopic, finalCommitmentHours, firestore]);

  const { data: matchingClubs, isLoading } = useCollection<BookClub>(matchingClubsQuery);

  useEffect(() => {
    if (user && matchingClubs) {
      const filtered = matchingClubs.filter(g => g.memberIds.length < 25 && !g.memberIds.includes(user.uid));
      setAvailableClubs(filtered);
    }
  }, [matchingClubs, user]);

  const handleFindClubs = () => {
    if (!finalTopic || !finalCommitmentHours) return;
    setStep(2);
  };
  
  const handleClose = () => {
    setStep(1);
    setTopic('');
    setCustomTopic('');
    setCommitmentHourOption('1');
    setCustomCommitmentHours('');
    setAvailableClubs([]);
    onClose();
  }

  const handleJoinSuccess = (clubId: string) => {
    handleClose();
    router.push(`/book-clubs/${clubId}`);
  };

  const findButtonDisabled = !finalTopic || !finalCommitmentHours || (topic === 'Other' && !customTopic);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join a Book Club</DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Select your preferences to find matching clubs."
              : "Here are clubs that match your criteria. Join one or create a new one."
            }
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 && (
          <div className="grid gap-4 py-4">
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
                       <DrawerDescription>Choose the primary focus for the book club.</DrawerDescription>
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
                  collectionPath="bookClubs"
                  placeholder="Search for a topic or club name"
                />
              </div>
            )}
            <div className="grid gap-2">
                <Label>Time Commitment (Hours per day)</Label>
                <RadioGroup value={commitmentHourOption} onValueChange={setCommitmentHourOption}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="1" id="h1-modal-club" /><Label htmlFor="h1-modal-club">1 hour</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="2" id="h2-modal-club" /><Label htmlFor="h2-modal-club">2 hours</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="3" id="h3-modal-club" /><Label htmlFor="h3-modal-club">3 hours</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="h-custom-modal-club" /><Label htmlFor="h-custom-modal-club">Custom</Label></div>
                </RadioGroup>
                {commitmentHourOption === 'custom' && (
                    <Input className="mt-2" type="number" placeholder="Enter hours per day" value={customCommitmentHours} onChange={(e) => setCustomCommitmentHours(e.target.value)} required min="1" />
                )}
            </div>
            <Button onClick={handleFindClubs} disabled={findButtonDisabled}>
              Find Clubs
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {isLoading && <p>Searching for clubs...</p>}
            {!isLoading && availableClubs.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Matching Clubs</h4>
                {availableClubs.map(club => (
                  <div key={club.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div>
                      <p className="font-semibold">{club.name}</p>
                      <p className="text-sm text-muted-foreground">{club.memberIds.length} / 25 members</p>
                    </div>
                    <JoinBookClubButton club={club} onJoinSuccess={handleJoinSuccess} />
                  </div>
                ))}
              </div>
            )}
             {!isLoading && availableClubs.length === 0 && (
                <div className="text-center py-4 space-y-2">
                    <p className="text-muted-foreground">No matching open clubs were found.</p>
                    <Button asChild onClick={handleClose}>
                        <Link href="/book-clubs/create">Create a New Club</Link>
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
