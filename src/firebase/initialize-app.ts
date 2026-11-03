import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

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
