'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, doc, writeBatch, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { UserProfile } from '@/lib/types';

export default function SubmitSoloProjectForm({ user, userProfile, onSuccess }: { user: any; userProfile: UserProfile, onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectUrl.trim() || !description.trim()) {
      toast({ variant: 'destructive', title: 'Please fill all fields' });
      return;
    }

    setIsSubmitting(true);

    try {
      const batch = writeBatch(firestore);
      const newProjectRef = doc(collection(firestore, 'soloProjects'));
      
      batch.set(newProjectRef, {
        userId: user.uid,
        username: userProfile.username,
        name,
        projectUrl,
        description,
        createdAt: serverTimestamp(),
      });

      const userDocRef = doc(firestore, 'users', user.uid);
      batch.update(userDocRef, {
        soloProjectIds: arrayUnion(newProjectRef.id)
      });
      
      await batch.commit();

      toast({ title: 'Project Submitted!', description: 'Your project is now visible to the community.' });
      setName('');
      setProjectUrl('');
      setDescription('');
      onSuccess();

    } catch (error: any) {
      console.error("Error submitting project: ", error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="projectName">Project Name</Label>
        <Input id="projectName" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Awesome App" disabled={isSubmitting} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="projectUrl">Project URL</Label>
        <Input id="projectUrl" type="url" value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)} placeholder="https://github.com/user/repo" disabled={isSubmitting} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="projectDescription">Description</Label>
        <Textarea id="projectDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description of what your project does." disabled={isSubmitting} required />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : 'Submit Project'}
      </Button>
    </form>
  );
}
