'use client';

import { useCallback } from 'react';
import type { User } from 'firebase/auth';
import { useUser } from '@/firebase';
import { useToast } from '@/components/ui/use-toast';

// Email sign-ups confirm their address before joining or posting. Google and
// GitHub vouch for the email themselves, so those members never wait.
export function needsEmailVerification(user: User | null): boolean {
  if (!user || user.emailVerified) return false;
  const providers = user.providerData.map(p => p.providerId);
  return providers.includes('password') && !providers.includes('google.com') && !providers.includes('github.com');
}

/** Returns a check to run before member-only actions; it explains why when it says no */
export function useVerifiedGuard() {
  const { user } = useUser();
  const { toast } = useToast();
  return useCallback(() => {
    if (!needsEmailVerification(user)) return true;
    toast({
      variant: 'destructive',
      title: 'Please verify your email first',
      description: `Open the link we sent to ${user?.email}. You can resend it from the banner at the top of the page.`,
    });
    return false;
  }, [user, toast]);
}
