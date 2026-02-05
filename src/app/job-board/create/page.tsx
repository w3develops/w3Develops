
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser, useFirestore, useDoc } from '@/firebase';
import { useToast } from "@/components/ui/use-toast";
import { collection, serverTimestamp, addDoc, doc, DocumentReference } from 'firebase/firestore';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import { UserProfile } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function CreateJobPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [applyUrl, setApplyUrl] = useState('');

  const userDocRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/job-board/create');
    }
  }, [user, isUserLoading, router]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) {
        toast({ variant: "destructive", title: "Not Authenticated" });
        return;
    }
    
    if (!title || !companyName || !location || !description || !applyUrl) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all required fields." });
      return;
    }
    
    setIsSubmitting(true);
    
    const jobData = {
        title,
        title_lowercase: title.toLowerCase(),
        companyName,
        location,
        description,
        applyUrl,
        postedById: user.uid,
        postedByUsername: userProfile.username,
        createdAt: serverTimestamp(),
    };
    
    try {
        const jobsCollection = collection(firestore, 'jobs');
        const newDocRef = await addDoc(jobsCollection, jobData);

        toast({ title: "Success!", description: "Your job posting has been created." });
        router.push(`/job-board/${newDocRef.id}`);
    } catch (error: any) {
        const permissionError = new FirestorePermissionError({
            path: collection(firestore, 'jobs').path,
            operation: 'create',
            requestResourceData: jobData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: "destructive", title: "Could Not Post Job", description: "A permission error occurred." });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isUserLoading || isProfileLoading || !user) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Post a New Job</CardTitle>
          <CardDescription>Share a job opportunity with the w3Develops community.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateJob} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="title">Job Title</Label>
              <Input id="title" placeholder="e.g., Frontend Developer" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" placeholder="e.g., Acme Inc." value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g., Remote or New York, NY" value={location} onChange={(e) => setLocation(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea id="description" placeholder="Describe the role, responsibilities, and qualifications." value={description} onChange={(e) => setDescription(e.target.value)} required rows={8} />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="applyUrl">Application URL</Label>
                <Input id="applyUrl" type="url" placeholder="https://example.com/apply" value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} required />
            </div>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Posting...' : 'Post Job'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
