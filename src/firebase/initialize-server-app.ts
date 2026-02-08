
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    return getSdks(getApp());
  }

  const app = initializeApp(firebaseConfig);
  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  const app = firebaseApp;
  // Use initializeFirestore to avoid issues with multiple instantiations
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
