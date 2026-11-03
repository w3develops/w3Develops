'use client';

import { useState } from 'react';
import { GithubAuthProvider, GoogleAuthProvider, signInWithPopup, type AuthProvider } from 'firebase/auth';
import { Github } from 'lucide-react';
import { useAuth } from '@/firebase';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

export function makeProvider(providerId: string): AuthProvider | null {
    if (providerId === 'google.com') return new GoogleAuthProvider();
    if (providerId === 'github.com') {
        // GitHub only shares the email address when asked for it
        const provider = new GithubAuthProvider();
        provider.addScope('user:email');
        return provider;
    }
    return null;
}

function errorMessage(code: string, label: string) {
    switch (code) {
        case 'auth/account-exists-with-different-credential':
            return 'An account already uses this email. Log in the way you signed up, then you can keep using that.';
        case 'auth/popup-blocked':
            return `Your browser blocked the ${label} window. Allow pop-ups for this site and try again.`;
        case 'auth/operation-not-allowed':
        case 'auth/unauthorized-domain':
            return `${label} sign-in isn't turned on yet. Please use email for now.`;
        default:
            return `Could not sign in with ${label}. Please try again.`;
    }
}

// Signs in with Google or GitHub. The page decides where to go next, because
// first-time members still need to pick a username before their profile exists.
export default function SocialSignInButtons({ disabled }: { disabled?: boolean }) {
    const auth = useAuth();
    const { toast } = useToast();
    const [pending, setPending] = useState<string | null>(null);

    const signIn = async (providerId: string, label: string) => {
        setPending(providerId);
        try {
            await signInWithPopup(auth, makeProvider(providerId)!);
        } catch (error: any) {
            if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                toast({ variant: 'destructive', title: 'Sign in failed', description: errorMessage(error.code, label) });
            }
        } finally {
            setPending(null);
        }
    };

    return (
        <div className="grid gap-2">
            <Button type="button" variant="outline" onClick={() => signIn('google.com', 'Google')} disabled={disabled || !!pending}>
                <GoogleIcon />
                {pending === 'google.com' ? 'Opening Google...' : 'Continue with Google'}
            </Button>
            <Button type="button" variant="outline" onClick={() => signIn('github.com', 'GitHub')} disabled={disabled || !!pending}>
                <Github className="w-4 h-4 mr-2" />
                {pending === 'github.com' ? 'Opening GitHub...' : 'Continue with GitHub'}
            </Button>
            <div className="flex items-center gap-2 my-2 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                or use email
                <div className="h-px flex-1 bg-border" />
            </div>
        </div>
    );
}
