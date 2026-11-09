import { appCheckSiteKey, firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

let appCheckStarted = false;

/**
 * App Check, in the browser only: each request to Firestore and the other
 * Firebase services carries a token showing it came from the real site.
 * Servers can't get one, which is why server-side reads use the Admin SDK
 * (src/lib/server-db.ts). On localhost, Firebase prints a debug token in
 * the browser console instead; register it in Firebase > App Check to test
 * locally once App Check is enforced.
 */
function startAppCheck(app: FirebaseApp) {
  if (appCheckStarted || typeof window === 'undefined' || !appCheckSiteKey) return;
  appCheckStarted = true;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

/**
 * @fileOverview Factory pattern for Firebase initialization.
 * Ensures the app is only initialized once, preventing duplicate instance errors.
 */

export function initializeFirebase() {
  // If an app is already initialized, return the existing SDKs (Factory Pattern)
  if (getApps().length) {
    return getSdks(getApp());
  }

  // Otherwise, initialize a new instance
  const app = initializeApp(firebaseConfig);
  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  const app = firebaseApp;
  // Before Firestore starts, so its first requests already carry a token
  startAppCheck(app);
  // Use initializeFirestore to ensure consistent configuration
  const firestore = initializeFirestore(app, {});

  // Conditionally initialize Analytics only on the client and if supported.
  const analytics = typeof window !== 'undefined' && firebaseConfig.measurementId 
    ? isSupported().then(yes => yes ? getAnalytics(app) : null)
    : Promise.resolve(null);

  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: firestore,
    analytics,
  };
}
