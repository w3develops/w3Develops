'use client';

import { useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { useUser } from '@/firebase';
import { useToast } from '@/components/ui/use-toast';

// Reminds members who signed up with email to confirm it. Google and GitHub
// accounts arrive already verified, so they never see this.
export default function EmailVerificationBanner() {
    const { user } = useUser();
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);
    const [verified, setVerified] = useState(false);

    if (!user || user.emailVerified || verified || !user.providerData.some(p => p.providerId === 'password')) {
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
                <span>Please verify your email address{user.email ? ` (${user.email})` : ''}.</span>
                <button type="button" onClick={resend} disabled={isSending} className="underline">
                    {isSending ? 'Sending...' : 'Resend email'}
                </button>
                <button type="button" onClick={recheck} className="underline">I&apos;ve verified it</button>
            </div>
        </div>
    );
}
