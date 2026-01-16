
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
import { BookClub } from '@/lib/types';
import JoinBookClubButton from '../JoinBookClubButton';
import Link from 'next/link';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter, DrawerDescription } from '@/components/ui/drawer';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NameSearchInput from '../NameSearchInput';


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
  const [commitment, setCommitment] = useState('part-time');
  const [step, setStep] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [availableClubs, setAvailableClubs] = useState<BookClub[]>([]);

  const finalTopic = topic === 'Other' ? customTopic : topic;

  const matchingClubsQuery = useMemo(() => {
    if (step !== 2 || !finalTopic || !commitment) return null;
    
    const oneWeekAgo = new Date(Date.now() - ONE_WEEK_IN_MS);
    const commitmentValue = commitmentLevels[commitment as keyof typeof commitmentLevels];

    return query(
      collection(firestore, 'bookClubs'),
      where('topic', '==', finalTopic),
      where('commitment', '==', commitmentValue),
      where('createdAt', '>', Timestamp.fromDate(oneWeekAgo))
    ) as Query<BookClub>;
  }, [step, finalTopic, commitment, firestore]);

  const { data: matchingClubs, isLoading } = useCollection<BookClub>(matchingClubsQuery);

  useEffect(() => {
    if (user && matchingClubs) {
      const filtered = matchingClubs.filter(g => g.memberIds.length < 25 && !g.memberIds.includes(user.uid));
      setAvailableClubs(filtered);
    }
  }, [matchingClubs, user]);

  const handleFindClubs = () => {
    if (!finalTopic || !commitment) return;
    setStep(2);
  };
  
  const handleClose = () => {
    setStep(1);
    setTopic('');
    setCustomTopic('');
    setCommitment('part-time');
    setAvailableClubs([]);
    onClose();
  }

  const handleJoinSuccess = (clubId: string) => {
    handleClose();
    router.push(`/book-clubs/${clubId}`);
  };

  const findButtonDisabled = !finalTopic || !commitment || (topic === 'Other' && !customTopic);

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
              <Label>Time Commitment</Label>
              <RadioGroup defaultValue="part-time" onValueChange={setCommitment} value={commitment}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="casual" id="casual-modal-club" />
                  <Label htmlFor="casual-modal-club">{commitmentLevels['casual']}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="part-time" id="part-time-modal-club" />
                  <Label htmlFor="part-time-modal-club">{commitmentLevels['part-time']}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="formal" id="formal-modal-club" />
                  <Label htmlFor="formal-modal-club">{commitmentLevels['formal']}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full-time" id="full-time-modal-club" />
                  <Label htmlFor="full-time-modal-club">{commitmentLevels['full-time']}</Label>
                </div>
              </RadioGroup>
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

    