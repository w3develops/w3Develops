'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { firebaseConfig } from '@/firebase/config';
import {
  OPEN_SETTINGS_EVENT, acceptTorNotice, isOnionHost, onConsentChange, savedAnalyticsChoice,
  sendsGlobalPrivacyControl, setAnalyticsChoice, shouldAskAboutAnalytics, torNoticeAccepted,
} from '@/lib/consent';

type Showing = 'tor' | 'analytics' | 'settings' | null;

/** Which notice to show: the Tor notice first (on the onion address), then the analytics question */
function pick(): Showing {
  if (isOnionHost() && !torNoticeAccepted()) return 'tor';
  if (shouldAskAboutAnalytics()) return 'analytics';
  return null;
}

/**
 * The privacy notices at the bottom of the page. On the Tor onion address,
 * visitors first accept a notice about the Google services the site uses.
 * Everyone is asked once whether Google Analytics may count their visits
 * (it stays off until they accept); the footer's Cookie settings link opens
 * it again. Renders nothing on the server, so pages hydrate cleanly.
 */
export default function ConsentBanner() {
  const [showing, setShowing] = useState<Showing>(null);

  useEffect(() => {
    // Read in the browser after hydration: the choices live in localStorage
    const update = () => setShowing(current => current === 'settings' ? current : pick());
    const timer = window.setTimeout(update, 0);
    const stop = onConsentChange(update);
    const open = () => setShowing('settings');
    window.addEventListener(OPEN_SETTINGS_EVENT, open);
    return () => {
      window.clearTimeout(timer);
      stop();
      window.removeEventListener(OPEN_SETTINGS_EVENT, open);
    };
  }, []);

  if (!showing) return null;

  const choose = (choice: 'granted' | 'denied') => {
    setAnalyticsChoice(choice, firebaseConfig.measurementId);
    setShowing(pick());
  };

  if (showing === 'tor') {
    return (
      <div role="dialog" aria-modal="true" aria-labelledby="tor-notice-title" className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-lg rounded-lg border bg-background p-5 shadow-lg space-y-3">
          <h2 id="tor-notice-title" className="text-lg font-semibold">You&apos;re visiting w3Develops over Tor</h2>
          <p className="text-sm text-muted-foreground">
            Tor hides your IP address and location from us and from Google. But this site still loads Google services:
            Firebase (sign-in and our database) and reCAPTCHA, which checks you&apos;re not a bot. Google can
            see that someone is using w3Develops, and if you sign in, what you do is linked to your account.
          </p>
          <p className="text-sm text-muted-foreground">
            You can browse without an account. <Link href="/tor" className="underline">Read more about using w3Develops over Tor</Link>.
          </p>
          <div className="flex justify-end">
            <Button onClick={acceptTorNotice}>I understand, continue</Button>
          </div>
        </div>
      </div>
    );
  }

  const current = savedAnalyticsChoice();
  return (
    <div role="region" aria-label="Cookie choices" className="fixed bottom-0 inset-x-0 z-[90] p-3 sm:p-4">
      <div className="mx-auto max-w-3xl rounded-lg border bg-background p-4 shadow-lg sm:flex sm:items-center sm:gap-4 space-y-3 sm:space-y-0">
        <p className="text-sm text-muted-foreground flex-1">
          We use Google Analytics to count visits, which sets cookies. It stays off unless you allow it. Sign-in and our
          bot check are needed for the site to work. <Link href="/cookies" className="underline">Cookies</Link>
          {' · '}<Link href="/privacy" className="underline">Privacy</Link>
          {showing === 'settings' && (
            <span className="block mt-1 text-xs">
              Now: {current === 'granted' ? 'allowed' : current === 'denied' ? 'off' : sendsGlobalPrivacyControl() ? 'off (your browser sends Global Privacy Control)' : 'off'}.
            </span>
          )}
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => choose('denied')}>Reject</Button>
          <Button size="sm" onClick={() => choose('granted')}>Allow analytics</Button>
        </div>
      </div>
    </div>
  );
}

/** The footer's Cookie settings link, which reopens the banner */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))}>
      Cookie settings
    </button>
  );
}
