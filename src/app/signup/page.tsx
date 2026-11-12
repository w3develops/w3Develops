
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useAuth, useUser, useFirestore } from '@/firebase';
import { useToast } from "@/components/ui/use-toast";
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { LoadingSkeleton } from '@/components/layout/loading-skeleton';
import { UserProfile, UserStatus } from '@/lib/types';
import { createUserWithEmailAndPassword, sendEmailVerification, User as FirebaseUser } from 'firebase/auth';
import SocialSignInButtons from '@/components/SocialSignInButtons';
import TimezoneSelect from '@/components/TimezoneSelect';
import { browserTimeZone } from '@/lib/timezones';
import { useBrowserTimeZone } from '@/lib/hooks/useClientValues';
import { getErrorMessage } from '@/lib/utils';
import { RESERVED_USERNAMES } from '@/lib/usernames';
import { Checkbox } from '@/components/ui/checkbox';

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
  // The browser's timezone until the member picks another
  const [chosenTimezone, setTimezone] = useState<string | null>(null);
  const browserTz = useBrowserTimeZone();
  const timezone = chosenTimezone ?? browserTz;
  
  const [usernameError, setUsernameError] = useState<string | null>(null);
  // New members confirm they meet the minimum age in the Terms of Use
  const [isOldEnough, setIsOldEnough] = useState(false);
  const [agreesToTerms, setAgreesToTerms] = useState(false);
  const [isUsernameChecking, setIsUsernameChecking] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedUsername = useDebounce(username, 500);


  // Signed-in members finish here when something required is missing: new
  // Google or GitHub members have no profile yet, and older members may be
  // missing a timezone. undefined means the profile is still loading.
  const [profile, setProfile] = useState<Partial<UserProfile> | null | undefined>(undefined);
  const needsUsername = !profile?.username;
  // Only brand-new profiles pick a timezone here; the header fills in a
  // missing one for older members from their browser
  const needsTimezone = !profile;
  const isComplete = !!profile && !needsUsername;
  const isFinishing = !!user && profile !== undefined && !isComplete;
  const isReturning = isFinishing && !!profile;
  // Members with a profile already confirmed their age when they joined
  const needsAgeCheck = !isReturning;

  // Forget the last member's profile as soon as a different member signs in
  const [profileUid, setProfileUid] = useState(user?.uid);
  if (profileUid !== user?.uid) {
    setProfileUid(user?.uid);
    setProfile(undefined);
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getDoc(doc(firestore, 'users', user.uid))
      .then(snap => { if (!cancelled) setProfile(snap.exists() ? snap.data() as UserProfile : null); })
      .catch(() => toast({ variant: "destructive", title: "Couldn't load your account", description: "Please refresh the page." }));
    return () => { cancelled = true; };
  }, [user, firestore, toast]);

  // Suggest a username from the Google or GitHub name when the finishing step appears
  const [wasFinishing, setWasFinishing] = useState(isFinishing);
  if (wasFinishing !== isFinishing) {
    setWasFinishing(isFinishing);
    if (isFinishing && needsUsername && !username && user?.displayName) {
      setUsername(user.displayName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24));
    }
  }

  // Each time the typed username settles, check its format straight away and
  // then whether it's taken
  const [checkedUsername, setCheckedUsername] = useState('');
  if (checkedUsername !== debouncedUsername) {
    setCheckedUsername(debouncedUsername);
    const validationError = debouncedUsername ? validateUsername(debouncedUsername) : null;
    setUsernameError(validationError);
    setIsUsernameAvailable(null);
    setIsUsernameChecking(!!debouncedUsername && !validationError);
  }

  useEffect(() => {
    if (!debouncedUsername || validateUsername(debouncedUsername)) return;
    let cancelled = false;
    getDoc(doc(firestore, 'usernames', debouncedUsername.toLowerCase()))
      .then(snap => { if (!cancelled) setIsUsernameAvailable(!snap.exists()); })
      .catch(() => {
        if (cancelled) return;
        setUsernameError("Couldn't check username.");
        setIsUsernameAvailable(null);
      })
      .finally(() => { if (!cancelled) setIsUsernameChecking(false); });
    return () => { cancelled = true; };
  }, [debouncedUsername, firestore]);

  useEffect(() => {
    if (!isUserLoading && user && isComplete) {
      router.push(redirectUrl);
    }
  }, [user, isUserLoading, isComplete, router, redirectUrl]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((needsUsername && !username) || (needsTimezone && !timezone) || (!isFinishing && (!email || !password))) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please fill out all fields." });
      return;
    }
    if (needsAgeCheck && !isOldEnough) {
      toast({ variant: "destructive", title: "Age requirement", description: "You need to be 13 or older to join w3Develops." });
      return;
    }
    if (needsAgeCheck && !agreesToTerms) {
      toast({ variant: "destructive", title: "Terms of Use", description: "Please agree to the Terms of Use and Privacy Policy to join." });
      return;
    }
    

    setIsSubmitting(true);
    
    try {
      const usernameLower = username.toLowerCase();
      if (needsUsername && (await getDoc(doc(firestore, 'usernames', usernameLower))).exists()) {
        setIsUsernameAvailable(false);
        throw new Error("This username is already in use.");
      }

      // Returning members only fill in what's missing from their profile
      if (isReturning && user) {
        const batch = writeBatch(firestore);
        const missing: Partial<UserProfile> = {};
        if (!profile?.timezone) missing.timezone = timezone || browserTimeZone();
        if (needsUsername) {
          missing.username = username;
          missing.username_lowercase = usernameLower;
          batch.set(doc(firestore, "usernames", usernameLower), { uid: user.uid });
        }
        batch.update(doc(firestore, "users", user.uid), missing);
        await batch.commit();
        setProfile({ ...profile, ...missing });
        return;
      }

      let finalUser: FirebaseUser;
      const currentUser = auth.currentUser;

      if (isFinishing && currentUser) {
        finalUser = currentUser;
        // Never overwrite a profile that was created in another tab
        const existing = await getDoc(doc(firestore, 'users', currentUser.uid));
        if (existing.exists()) {
          setProfile(existing.data() as UserProfile);
          return;
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        finalUser = userCredential.user;
        // Google and GitHub confirm emails themselves; email sign-ups confirm here
        sendEmailVerification(finalUser).catch(() => {});
      }

      const batch = writeBatch(firestore);
      const userDocRef = doc(firestore, "users", finalUser.uid);
      const userData: Partial<UserProfile> = {
        id: finalUser.uid,
        username: username,
        username_lowercase: usernameLower,
        timezone,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        profilePictureUrl: finalUser.photoURL || '',
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
      setProfile(userData);
      // Go straight on, so a slow profile read from before the commit can't
      // show the finishing step again
      router.push(redirectUrl);
        
    } catch (error) {
      toast({ variant: "destructive", title: "Sign up failed", description: getErrorMessage(error) });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (isUserLoading || (user && !isFinishing && !isSubmitting)) {
    return <LoadingSkeleton />;
  }


  return (
    <div className="p-4 md:p-10">
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">{isFinishing ? 'Finish Your Account' : 'Create an Account'}</CardTitle>
            <CardDescription>
              {isReturning
                ? 'Welcome back! Please pick a username so your profile shows correctly.'
                : isFinishing
                ? `Signed in as ${user?.email || 'your account'}. Pick a username and timezone to finish.`
                : 'Join our global community of developers.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isFinishing && <SocialSignInButtons disabled={isSubmitting} />}
            <form onSubmit={handleSignUp} className="grid gap-4">
              {needsUsername && (
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
              )}

              {needsTimezone && (
              <div className="grid gap-2">
                <Label htmlFor="timezone">Your timezone</Label>
                <TimezoneSelect id="timezone" value={timezone} onChange={setTimezone} disabled={isSubmitting} />
                <p className="text-xs text-muted-foreground">We detected this from your browser. Group times are shown in it.</p>
              </div>
              )}

              {!isFinishing && <>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} />
              </div>
              </>}

              {needsAgeCheck && (
              <div className="flex items-start gap-2">
                <Checkbox id="ageConfirm" checked={isOldEnough} onCheckedChange={checked => setIsOldEnough(!!checked)} disabled={isSubmitting} aria-describedby="ageConfirmNote" className="mt-0.5" />
                <div className="grid gap-1">
                  <Label htmlFor="ageConfirm" className="text-sm font-normal leading-snug">I&apos;m 13 or older</Label>
                  <p id="ageConfirmNote" className="text-xs text-muted-foreground">
                    Members must be at least 13, as our{' '}
                    <Link href="/terms" target="_blank" className="underline">Terms of Use</Link> say.
                  </p>
                </div>
              </div>
              )}

              {needsAgeCheck && (
                <div className="flex items-start gap-2">
                  <Checkbox id="agreeTerms" checked={agreesToTerms} onCheckedChange={checked => setAgreesToTerms(!!checked)} disabled={isSubmitting} className="mt-0.5" />
                  <Label htmlFor="agreeTerms" className="text-sm font-normal leading-snug">
                    I agree to the{' '}
                    <Link href="/terms" target="_blank" className="underline">Terms of Use</Link> and{' '}
                    <Link href="/privacy" target="_blank" className="underline">Privacy Policy</Link>
                  </Label>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting || (needsUsername && !isUsernameAvailable) || (needsTimezone && !timezone) || (needsAgeCheck && (!isOldEnough || !agreesToTerms))}>
                {isSubmitting ? 'Creating Account...' : isFinishing ? 'Finish' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center text-sm">
            {isFinishing ? (
              <button type="button" onClick={() => auth.signOut()} className="underline">Use a different account</button>
            ) : (
              <>
                Already have an account?&nbsp;
                <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="underline">Login</Link>
              </>
            )}
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
