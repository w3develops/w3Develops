
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser, useAuth, useFirestore } from '@/firebase';
import { useToast } from "@/components/ui/use-toast";
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";
import { sendPasswordResetEmail, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

export default function SecurityPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isPasswordResetting, setIsPasswordResetting] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isEmailChanging, setIsEmailChanging] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/security');
    }
  }, [user, isUserLoading, router]);

  const handlePasswordReset = async () => {
    if (!user || !user.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not find your email address.",
      });
      return;
    }
    setIsPasswordResetting(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: "Password Reset Email Sent",
        description: `A password reset link has been sent to ${user.email}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send password reset email. Please try again.",
      });
    } finally {
      setIsPasswordResetting(false);
    }
  };
  
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) {
      toast({ variant: "destructive", title: "Not logged in" });
      return;
    }
    if (!newEmail || !currentPassword) {
      toast({ variant: "destructive", title: "Missing fields" });
      return;
    }

    setIsEmailChanging(true);

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // If re-authentication is successful, update email
      await updateEmail(user, newEmail);

      // Update email in Firestore profile document
      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, { email: newEmail });
      
      toast({
        title: "Email Change Successful",
        description: `Your email has been changed. A verification link was sent to ${newEmail}.`,
      });
      setNewEmail('');
      setCurrentPassword('');

    } catch (error: any) {
      let description = "An unknown error occurred.";
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          description = "The password you entered is incorrect.";
          break;
        case 'auth/email-already-in-use':
          description = "This email is already in use by another account.";
          break;
        case 'auth/requires-recent-login':
            description = "This action is sensitive and requires a recent login. Please log out and log back in again before retrying."
            break;
        case 'auth/invalid-email':
          description = "The new email address is not valid.";
          break;
      }
      toast({
        variant: "destructive",
        title: "Email Change Failed",
        description: description,
      });
    } finally {
      setIsEmailChanging(false);
    }
  };


  if (isUserLoading || !user) {
    return (
        <div className="p-4 md:p-10">
            <LoadingSkeleton />
        </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-4 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Click the button below to receive a password reset link at your registered email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={handlePasswordReset} disabled={isPasswordResetting}>
                {isPasswordResetting ? 'Sending...' : 'Send Password Reset Email'}
            </Button>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>Change Email Address</CardTitle>
          <CardDescription>
            Enter your current password and new email address. A verification link will be sent to your new email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="current-email">Current Email</Label>
                <Input id="current-email" type="email" value={user.email || ''} disabled />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input 
                    id="current-password" 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={isEmailChanging}
                />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="new-email">New Email</Label>
                <Input 
                    id="new-email"
                    type="email"
                    placeholder="new.email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    disabled={isEmailChanging}
                />
            </div>
            <Button type="submit" disabled={isEmailChanging}>
              {isEmailChanging ? 'Updating Email...' : 'Change Email'}
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}
