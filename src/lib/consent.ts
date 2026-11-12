// Visitors' privacy choices, kept in their own browser (never on the server).
//
// Google Analytics is the site's only optional tracking. It stays off until
// the visitor accepts it in the cookie banner. Browsers that send Global
// Privacy Control count as a "no" unless the visitor later says yes.
// Everything else the site stores (sign-in, the App Check bot check, and
// "don't show again" notes) is needed for the site to work.

export type AnalyticsChoice = 'granted' | 'denied';

const ANALYTICS_KEY = 'w3-consent-analytics';
const TOR_KEY = 'w3-tor-notice';
const CHANGE_EVENT = 'w3-consent-change';

function read(key: string): string | null {
  try { return typeof window === 'undefined' ? null : localStorage.getItem(key); } catch { return null; }
}

function write(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* storage blocked: the choice lasts this page only */ }
}

/** True when the browser sends the Global Privacy Control signal */
export function sendsGlobalPrivacyControl(): boolean {
  return typeof navigator !== 'undefined' && (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

/** The visitor's saved choice, or null if they haven't made one */
export function savedAnalyticsChoice(): AnalyticsChoice | null {
  const value = read(ANALYTICS_KEY);
  return value === 'granted' || value === 'denied' ? value : null;
}

/** Whether Analytics may run: only after a yes */
export function analyticsAllowed(): boolean {
  return savedAnalyticsChoice() === 'granted';
}

/** Whether to ask: no saved choice, and no Global Privacy Control "no" */
export function shouldAskAboutAnalytics(): boolean {
  return savedAnalyticsChoice() === null && !sendsGlobalPrivacyControl();
}

export function setAnalyticsChoice(choice: AnalyticsChoice, measurementId?: string) {
  write(ANALYTICS_KEY, choice);
  if (choice === 'denied' && typeof window !== 'undefined') {
    // Stop Analytics if it already started this visit, and drop its cookies
    if (measurementId) (window as unknown as Record<string, boolean>)[`ga-disable-${measurementId}`] = true;
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('_ga')) {
        const host = location.hostname.replace(/^www\./, '');
        for (const domain of ['', `; domain=${host}`, `; domain=.${host}`]) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
        }
      }
    }
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Resolves once Analytics is allowed (now, or when the visitor accepts later) */
export function whenAnalyticsAllowed(): Promise<void> {
  return new Promise(resolve => {
    if (analyticsAllowed()) return resolve();
    const check = () => {
      if (!analyticsAllowed()) return;
      window.removeEventListener(CHANGE_EVENT, check);
      resolve();
    };
    window.addEventListener(CHANGE_EVENT, check);
  });
}

/** Listen for choice changes (for the banner and the settings link) */
export function onConsentChange(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

/** Asks the cookie banner to open again, from the footer's Cookie settings link */
export const OPEN_SETTINGS_EVENT = 'w3-open-cookie-settings';

/** True on the Tor onion address */
export function isOnionHost(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.endsWith('.onion');
}

export function torNoticeAccepted(): boolean {
  return read(TOR_KEY) === 'accepted';
}

export function acceptTorNotice() {
  write(TOR_KEY, 'accepted');
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
