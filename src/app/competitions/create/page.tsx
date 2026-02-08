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
import { collection, serverTimestamp, doc, addDoc, Timestamp } from 'firebase/firestore';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function CreateCompetitionPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [prize, setPrize] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/competitions/create');
    }
  }, [user, isUserLoading, router]);

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
        toast({ variant: "destructive", title: "Not Authenticated" });
        return;
    }
    
    if (!name || !description || !startDate || !endDate) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all required fields." });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
        toast({ variant: "destructive", title: "Invalid Dates", description: "End date must be after the start date." });
        return;
    }
    
    setIsSubmitting(true);
    
    const competitionData = {
        name: name,
        name_lowercase: name.toLowerCase(),
        description: description,
        rules: rules || 'Standard competition rules apply.',
        prize: prize || 'Bragging rights',
        creatorId: user.uid,
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        createdAt: serverTimestamp(),
    };
    
    const competitionsCollection = collection(firestore, 'competitions');
    addDoc(competitionsCollection, competitionData)
        .then((newDocRef) => {
            toast({ title: "Success!", description: "Your new competition has been created." });
            router.push(`/competitions/${newDocRef.id}`);
        })
        .catch(async (error) => {
            const permissionError = new FirestorePermissionError({
                path: competitionsCollection.path,
                operation: 'create',
                requestResourceData: competitionData,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: "destructive", title: "Could Not Create Competition", description: "A permission error occurred." });
        })
        .finally(() => {
            setIsSubmitting(false);
        });
  };

  if (isUserLoading || !user) {
    return <LoadingSkeleton />;
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Competition</CardTitle>
          <CardDescription>Organize a coding challenge for the community.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCompetition} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Competition Name</Label>
              <Input id="name" placeholder="e.g., Ultimate Algorithm Challenge" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="A brief summary of the competition's theme and goals." value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="grid gap-2"><Label htmlFor="startDate">Start Date</Label><Input id="startDate" type="date" value={startDate} min={today} onChange={e => setStartDate(e.target.value)} required /></div>
                <div className="grid gap-2"><Label htmlFor="endDate">End Date</Label><Input id="endDate" type="date" value={endDate} min={startDate || today} onChange={e => setEndDate(e.target.value)} required /></div>
            </div>
            
            <div className="grid gap-2">
                <Label htmlFor="rules">Rules (Optional)</Label>
                <Textarea id="rules" placeholder="Detail the rules and judging criteria. If left blank, standard rules apply." value={rules} onChange={(e) => setRules(e.target.value)} />
            </div>

             <div className="grid gap-2">
                <Label htmlFor="prize">Prize (Optional)</Label>
                <Input id="prize" placeholder="e.g., $100 Amazon Gift Card" value={prize} onChange={(e) => setPrize(e.target.value)} />
            </div>
            
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Competition'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
