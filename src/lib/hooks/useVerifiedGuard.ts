'use client';

import { useCallback } from 'react';
import type { User } from 'firebase/auth';
import { useUser } from '@/firebase';
import { useToast } from '@/components/ui/use-toast';

// Firebase's IDs for Google and GitHub sign-in. They vouch for the email
// themselves, so members who use them never wait.
const TRUSTED_PROVIDER_IDS = new Set(['google.com', 'github.com']);

// Email sign-ups confirm their address before joining or posting.
export function needsEmailVerification(user: User | null): boolean {
  if (!user || user.emailVerified) return false;
  const providerIds = user.providerData.map(p => p.providerId);
  const usesPassword = providerIds.some(id => id === 'password');
  const usesTrustedProvider = providerIds.some(id => TRUSTED_PROVIDER_IDS.has(id));
  return usesPassword && !usesTrustedProvider;
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
