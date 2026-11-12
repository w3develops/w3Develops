import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { ONION_ADDRESS } from '@/lib/onion';
import { pageMetadata } from '@/lib/site-pages';

export const metadata: Metadata = pageMetadata('/tor');

const linkClass = 'text-primary underline';

export default function TorPage() {
    return (
        <LegalPage
            icon={<Shield className="h-10 w-10" />}
            title="Using w3Develops over Tor"
            lastUpdated="November 12, 2026"
            intro={
                <p>
                    w3Develops has an onion address, so you can visit through the Tor network without revealing your IP address.
                    Here&apos;s what that protects, and what it doesn&apos;t.
                </p>
            }
        >
            <LegalSection title="Our onion address" summary="Open it in Tor Browser. Check it matches exactly.">
                <p className="font-mono break-all rounded-md bg-muted p-3">http://{ONION_ADDRESS}</p>
                <p>
                    Tor Browser also offers this address automatically on w3develops.org, with a &quot;.onion available&quot;
                    button in the address bar.
                </p>
            </LegalSection>

            <LegalSection title="What Tor protects" summary="Your IP address and location are hidden from us and from Google.">
                <p>
                    When you use the onion address, your connection goes through the Tor network, so neither w3Develops nor the
                    services the site uses can see your real IP address or where you are.
                </p>
            </LegalSection>

            <LegalSection title="What it doesn't" summary="Pages still load Google services, and signing in links what you do to your account.">
                <p>The onion site is the same w3Develops, and it still uses:</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Firebase</strong> (by Google) for sign-in and our database. Your browser talks to Google&apos;s servers directly, over Tor.</li>
                    <li><strong>reCAPTCHA</strong> (by Google), which checks that visitors aren&apos;t bots.</li>
                    <li><strong>Google Analytics</strong>, only if you allow it in the cookie banner. It&apos;s off unless you say yes.</li>
                </ul>
                <p>
                    Google can see that someone is using w3Develops, but not who you are, unless you sign in. If you sign in, what
                    you do on the site is linked to your account, just like on w3develops.org. You can browse without an account.
                </p>
                <p>
                    Tor Browser&apos;s &quot;Safest&quot; security level turns off JavaScript, which most of w3Develops needs.
                    The &quot;Safer&quot; level works.
                </p>
            </LegalSection>

            <LegalSection title="More">
                <p>
                    Our <Link href="/privacy" className={linkClass}>Privacy Policy</Link> and{' '}
                    <Link href="/cookies" className={linkClass}>Cookies</Link> pages cover everything we store. Our{' '}
                    <Link href="/warrant-canary" className={linkClass}>warrant canary</Link> is signed with PGP. Questions? Email{' '}
                    <a href="mailto:privacy@w3develops.org" className={linkClass}>privacy@w3develops.org</a>.
                </p>
            </LegalSection>
        </LegalPage>
    );
}
