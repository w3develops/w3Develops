
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
import { MessageSquareQuote } from 'lucide-react';

function FeedbackForm({ username, userId }: { username: string; userId: string }) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast({
        variant: 'destructive',
        title: 'Feedback cannot be empty',
      });
      return;
    }
    setIsSubmitting(true);

    try {
      const feedbackCollection = collection(firestore, 'feedback');
      await addDoc(feedbackCollection, {
        feedback: feedback,
        createdAt: serverTimestamp(),
        userId: userId,
        username: username,
      });

      toast({
        title: 'Feedback Submitted!',
        description: "Thank you for helping us improve w3Develops.",
      });
      setFeedback('');

    } catch (error: any) {
      console.error("Error submitting feedback: ", error);
      toast({
        variant: 'destructive',
        title: 'Feedback Submission Failed',
        description: error.message || 'An unknown error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="feedback" className="text-base">
          Your Feedback
        </Label>
        <Textarea
          id="feedback"
          placeholder="What's on your mind? Suggestions, bug reports, and feature requests are all welcome."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={6}
          maxLength={2000}
          disabled={isSubmitting}
          required
        />
        <p className="text-sm text-muted-foreground text-right">
          {feedback.length} / 2000
        </p>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </form>
  );
}


export default function FeedbackPage() {
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
          <CardTitle className="font-headline text-3xl">Submit Feedback</CardTitle>
          <CardDescription>
            We value your input! Let us know how we can improve the w3Develops community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userProfile ? (
            <FeedbackForm username={userProfile.username} userId={user.uid} />
          ) : (
             <div className="text-center py-12">
                <MessageSquareQuote className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-xl font-semibold mt-4">Could not load user profile</h3>
                <p className="text-muted-foreground mt-2">
                    We were unable to load your user profile, which is required to submit feedback. Please try again later or contact support if the issue persists.
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
