
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useAuth, useUser, useFirestore } from '@/firebase';
import { useToast } from "@/components/ui/use-toast";
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import { UserProfile, UserStatus } from '@/lib/types';
import { EmailAuthProvider, linkWithCredential, createUserWithEmailAndPassword, User as FirebaseUser, UserCredential } from 'firebase/auth';

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

function validatePassword(password: string) {
    const errors: string[] = [];
    if (password.length < 6) {
        errors.push("be at least 6 characters long");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("contain an uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("contain a lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("contain a number");
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push("contain a special character");
    }
    
    if (errors.length > 0) {
        return `Password must ${errors.join(', ')}.`;
    }
    return null;
}

const RESERVED_USERNAMES = [
  'root', 'admin', 'abuse', 'webmaster', 'spam', 'help',
  'administratorrequest', 'invalid', 'valid', 'error', 'motd',
  'authenticateduser', 'login:', 'password:'
];

function validateUsername(username: string): string | null {
  if (username.length < 3) {
    return 'Username must be at least 3 characters long.';
  }
  if (username.length > 24) {
    return 'Username cannot be longer than 24 characters.';
  }
  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    return 'Username can only contain letters and numbers.';
  }
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return 'This username is reserved and cannot be used.';
  }
  return null;
}

const UTC_CATEGORIES = [
  { id: 'A', label: 'A: 0 to 4', offsets: [0, 1, 2, 3, 4] },
  { id: 'B', label: 'B: 5 to 9', offsets: [5, 6, 7, 8, 9] },
  { id: 'C', label: 'C: 10 to 12', offsets: [10, 11, 12] },
  { id: 'D', label: 'D: -1 to -4', offsets: [-1, -2, -3, -4] },
  { id: 'E', label: 'E: -5 to -9 (USA/Canada)', offsets: [-5, -6, -7, -8, -9] },
  { id: 'F', label: 'F: -10 to -12', offsets: [-10, -11, -12] },
];

function SignupPageContent() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';

  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [utcCategory, setUtcCategory] = useState('');
  const [specificOffset, setSpecificOffset] = useState('');
  
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isUsernameChecking, setIsUsernameChecking] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedUsername = useDebounce(username, 500);

  const checkUsername = useCallback(async (usernameToCheck: string) => {
    setIsUsernameChecking(true);
    const validationError = validateUsername(usernameToCheck);
    setUsernameError(validationError);

    if (validationError) {
        setIsUsernameChecking(false);
        setIsUsernameAvailable(null);
        return;
    }

    const usernameLower = usernameToCheck.toLowerCase();
    try {
        const usernameDocRef = doc(firestore, 'usernames', usernameLower);
        const docSnap = await getDoc(usernameDocRef);
        setIsUsernameAvailable(!docSnap.exists());
    } catch (err) {
        setUsernameError("Couldn't check username.");
        setIsUsernameAvailable(null);
    } finally {
        setIsUsernameChecking(false);
    }
  }, [firestore]);

  useEffect(() => {
    if (debouncedUsername) {
      checkUsername(debouncedUsername);
    } else {
      setUsernameError(null);
      setIsUsernameAvailable(null);
      setIsUsernameChecking(false);
    }
  }, [debouncedUsername, checkUsername]);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push(redirectUrl);
    }
  }, [user, isUserLoading, router, redirectUrl]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !specificOffset) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please fill out all fields." });
      return;
    }
    
    const offsetNum = Number(specificOffset);
    if (isNaN(offsetNum)) {
        toast({ variant: "destructive", title: "Invalid Offset", description: "Please select a valid UTC offset." });
        return;
    }

    setIsSubmitting(true);
    
    try {
      const usernameLower = username.toLowerCase();
      const usernameDocRef = doc(firestore, 'usernames', usernameLower);
      const usernameDoc = await getDoc(usernameDocRef);
      if (usernameDoc.exists()) {
        setIsUsernameAvailable(false);
        throw new Error("This username is already in use.");
      }

      let finalUser: FirebaseUser;
      const currentUser = auth.currentUser;

      if (currentUser && currentUser.isAnonymous) {
        const credential = EmailAuthProvider.credential(email, password);
        const userCredential = await linkWithCredential(currentUser, credential);
        finalUser = userCredential.user;
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        finalUser = userCredential.user;
      }

      const batch = writeBatch(firestore);
      const userDocRef = doc(firestore, "users", finalUser.uid);
      const userData: Partial<UserProfile> = {
        id: finalUser.uid,
        email: finalUser.email!,
        username: username,
        username_lowercase: usernameLower,
        utcOffset: offsetNum,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        profilePictureUrl: '',
        bio: '',
        socialLinks: { github: '', linkedin: '', twitter: '' },
        skills: [],
        followers: [],
        following: [],
        followInfoPrivate: false,
        notificationSettings: {
            dailyCodingNewsletter: false,
            dailyJsNewsletter: false,
            weeklyBookClub: false,
            tipsAndTricks: false,
            interviewQuestions: false,
            weeklyDigest: false,
            surveys: false,
        },
        status: 'inactive' as UserStatus,
      };
      
      batch.set(userDocRef, userData, { merge: true }); 
      batch.set(doc(firestore, "usernames", usernameLower), { uid: finalUser.uid });
      await batch.commit();
        
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sign up failed", description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (isUserLoading || user) {
    return <LoadingSkeleton />;
  }

  const selectedCategory = UTC_CATEGORIES.find(c => c.id === utcCategory);

  return (
    <div className="p-4 md:p-10">
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
            <CardDescription>Join our global community of developers.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="adalovelace"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="username"
                />
                <div className="h-4">
                  {isUsernameChecking && <p className="text-xs text-muted-foreground">Checking...</p>}
                  {!isUsernameChecking && usernameError && <p className="text-xs text-destructive">{usernameError}</p>}
                  {!isUsernameChecking && !usernameError && isUsernameAvailable === false && <p className="text-xs text-destructive">Taken.</p>}
                  {!isUsernameChecking && !usernameError && isUsernameAvailable === true && username.length > 0 && <p className="text-xs text-green-600">Available!</p>}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>What is the UTC timezone for where you will be coding from?</Label>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  (If unsure, <Link href="/time-converter" className="text-primary underline">check our time converter here</Link>) Ex. Florida = -4
                </p>
                <Select value={utcCategory} onValueChange={setUtcCategory}>
                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                        {UTC_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                {selectedCategory && (
                    <Select value={specificOffset} onValueChange={setSpecificOffset}>
                        <SelectTrigger><SelectValue placeholder="Specific Offset" /></SelectTrigger>
                        <SelectContent>
                            {selectedCategory.offsets.map(o => (
                                <SelectItem key={o} value={o.toString()}>UTC {o >= 0 ? '+' : ''}{o}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting || !isUsernameAvailable || !specificOffset}>
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center text-sm">
            Already have an account?&nbsp;
            <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="underline">Login</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SignupPageContent />
    </Suspense>
  )
}
