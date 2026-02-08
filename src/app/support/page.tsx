'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { addDoc, collection, doc, serverTimestamp, DocumentReference } from 'firebase/firestore';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import { UserProfile } from '@/lib/types';
import Link from 'next/link';
import { LifeBuoy } from 'lucide-react';
import { Input } from '@/components/ui/input';

function SupportForm({ username, userId, email }: { username: string; userId: string, email: string }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast({
        variant: 'destructive',
        title: 'All fields are required',
      });
      return;
    }
    setIsSubmitting(true);

    try {
      const supportCollection = collection(firestore, 'supportRequests');
      await addDoc(supportCollection, {
        subject,
        description,
        status: 'open',
        createdAt: serverTimestamp(),
        userId: userId,
        username: username,
        email: email,
      });

      toast({
        title: 'Support Ticket Submitted!',
        description: "Thank you for reaching out. We will get back to you shortly.",
      });
      setSubject('');
      setDescription('');

    } catch (error: any) {
      console.error("Error submitting support ticket: ", error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'An unknown error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       <div className="grid gap-2">
        <Label htmlFor="subject" className="text-base">
          Subject
        </Label>
        <Input
          id="subject"
          placeholder="e.g., Trouble resetting my password"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={100}
          disabled={isSubmitting}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description" className="text-base">
          Description
        </Label>
        <Textarea
          id="description"
          placeholder="Please describe the issue you are experiencing in detail."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          maxLength={2000}
          disabled={isSubmitting}
          required
        />
        <p className="text-sm text-muted-foreground text-right">
          {description.length} / 2000
        </p>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
      </Button>
    </form>
  );
}


export default function SupportPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push(`/login?redirect=${pathname}`);
    }
  }, [user, isUserLoading, router, pathname]);

  const userDocRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);
  
  if (isUserLoading || !user || isProfileLoading) {
    return (
      <div className="p-4 md:p-10">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Technical Support</CardTitle>
          <CardDescription>
            Need help with your account or experiencing a technical issue? Fill out the form below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userProfile && userProfile.email ? (
            <SupportForm username={userProfile.username} userId={user.uid} email={userProfile.email} />
          ) : (
             <div className="text-center py-12">
                <LifeBuoy className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-xl font-semibold mt-4">Could not load user profile</h3>
                <p className="text-muted-foreground mt-2">
                    We were unable to load your user profile, which is required to submit a support ticket. Please try again later or contact support if the issue persists.
                </p>
                 <Button asChild variant="outline" className="mt-4">
                    <Link href="/account">Go to Dashboard</Link>
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
