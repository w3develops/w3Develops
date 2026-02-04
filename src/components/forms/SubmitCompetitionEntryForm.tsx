'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { CompetitionEntry, SoloProject } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface SubmitCompetitionEntryFormProps {
  user: any;
  competitionId: string;
  userSoloProjects: SoloProject[];
  onSuccess: () => void;
}

export default function SubmitCompetitionEntryForm({ user, competitionId, userSoloProjects, onSuccess }: SubmitCompetitionEntryFormProps) {
  const [description, setDescription] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [soloProjectId, setSoloProjectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (soloProjectId) {
      const selectedProject = userSoloProjects.find(p => p.id === soloProjectId);
      if (selectedProject) {
        setProjectUrl(selectedProject.projectUrl);
        setDescription(selectedProject.description);
      }
    }
  }, [soloProjectId, userSoloProjects]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectUrl.trim()) {
      toast({ variant: 'destructive', title: 'Project URL is required' });
      return;
    }

    setIsSubmitting(true);
    
    const entryData = {
        competitionId,
        userId: user.uid,
        username: user.displayName || user.email,
        projectUrl,
        description: description || 'No description provided.',
        soloProjectId: soloProjectId || null,
        submittedAt: serverTimestamp(),
        voteCount: 0,
    };

    try {
      const entriesCollection = collection(firestore, 'competitions', competitionId, 'entries');
      await addDoc(entriesCollection, entryData);
      
      toast({ title: 'Entry Submitted!', description: 'Your entry has been successfully submitted to the competition.' });
      onSuccess();

    } catch (error: any) {
        const permissionError = new FirestorePermissionError({
            path: collection(firestore, 'competitions', competitionId, 'entries').path,
            operation: 'create',
            requestResourceData: entryData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: 'Submission Failed', description: "Could not submit your entry due to a permission error." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {userSoloProjects.length > 0 && (
        <div className="space-y-2">
            <Label htmlFor="soloProjectSelect">Or use an existing Solo Project</Label>
            <Select value={soloProjectId} onValueChange={setSoloProjectId}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">-- Enter manually --</SelectItem>
                    {userSoloProjects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
             <p className="text-xs text-muted-foreground">Selecting a project will auto-fill the fields below.</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="projectUrl">Project URL</Label>
        <Input id="projectUrl" type="url" value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)} placeholder="https://github.com/user/repo or live URL" disabled={isSubmitting || !!soloProjectId} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description of your project." disabled={isSubmitting || !!soloProjectId} />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : 'Submit Entry'}
      </Button>
    </form>
  );
}