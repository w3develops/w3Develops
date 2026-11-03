'use client';

import { useEffect, useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { useUser } from '@/firebase';
import { useToast } from '@/components/ui/use-toast';
import { needsEmailVerification } from '@/lib/hooks/useVerifiedGuard';

// Email sign-ups confirm their address before joining or posting. Google and
// GitHub accounts arrive already verified, so they never see this.
export default function EmailVerificationBanner() {
    const { user } = useUser();
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);
    const [verified, setVerified] = useState(false);
    const waiting = !!user && !verified && needsEmailVerification(user);

    // Most people click the link in another tab, so check again when they come back
    useEffect(() => {
        if (!waiting || !user) return;
        const onFocus = async () => {
            await user.reload().catch(() => {});
            if (user.emailVerified) {
                // Fresh token so security rules see the verified email right away
                await user.getIdToken(true);
                setVerified(true);
            }
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [waiting, user]);

    if (!waiting || !user) {
        return null;
    }

    const resend = async () => {
        setIsSending(true);
        try {
            await sendEmailVerification(user);
            toast({ title: 'Verification email sent', description: `Check ${user.email} for the link.` });
        } catch (error: any) {
            const tooMany = error.code === 'auth/too-many-requests';
            toast({
                variant: 'destructive',
                title: 'Could not send the email',
                description: tooMany ? 'One was sent recently. Please wait a few minutes and try again.' : 'Please try again.',
            });
        } finally {
            setIsSending(false);
        }
    };

    const recheck = async () => {
        await user.reload();
        if (user.emailVerified) {
            // Fresh token so security rules see the verified email right away
            await user.getIdToken(true);
            setVerified(true);
            toast({ title: 'Email verified', description: 'Thanks for confirming your email.' });
        } else {
            toast({ title: 'Not verified yet', description: 'Open the link in the email we sent, then try again.' });
        }
    };

    return (
        <div className="bg-primary/15 border-b border-primary/30 text-sm">
            <div className="container mx-auto flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                <span>Verify your email{user.email ? ` (${user.email})` : ''} to join groups and post. Check your inbox for the link.</span>
                <button type="button" onClick={resend} disabled={isSending} className="underline">
                    {isSending ? 'Sending...' : 'Resend email'}
                </button>
                <button type="button" onClick={recheck} className="underline">I&apos;ve verified it</button>
            </div>
        </div>
    );
}
