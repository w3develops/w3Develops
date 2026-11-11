import { appCheckSiteKey, firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, initializeFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

let appCheckStarted = false;

// Local testing against the Firebase emulators instead of the live project:
//   NEXT_PUBLIC_USE_EMULATORS=1 npx next dev   (the "dev-emulated" launch config)
// with `firebase emulators:start --only auth,firestore` running. Ports default
// to firebase.json's and can be changed with NEXT_PUBLIC_AUTH_EMULATOR_PORT and
// NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT (and NEXT_PUBLIC_FUNCTIONS_EMULATOR_PORT
// and NEXT_PUBLIC_STORAGE_EMULATOR_PORT, with those emulators). Never set on
// the live site.
const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === '1';
const authEmulatorPort = Number(process.env.NEXT_PUBLIC_AUTH_EMULATOR_PORT || 9099);
const firestoreEmulatorPort = Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || 8080);
const functionsEmulatorPort = Number(process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_PORT || 5001);
let emulatorsConnected = false;
let functionsEmulatorConnected = false;
const storageEmulatorPort = Number(process.env.NEXT_PUBLIC_STORAGE_EMULATOR_PORT || 9199);
let storageEmulatorConnected = false;

/** Cloud Storage, for images on feed posts (storage.rules) */
export function appStorage(app: FirebaseApp): FirebaseStorage {
  const storage = getStorage(app);
  if (useEmulators && !storageEmulatorConnected) {
    storageEmulatorConnected = true;
    connectStorageEmulator(storage, '127.0.0.1', storageEmulatorPort);
  }
  return storage;
}

/** Cloud Functions the site calls (functions/src), in the database's region */
export function appFunctions(app: FirebaseApp): Functions {
  const functions = getFunctions(app, 'us-central1');
  if (useEmulators && !functionsEmulatorConnected) {
    functionsEmulatorConnected = true;
    connectFunctionsEmulator(functions, '127.0.0.1', functionsEmulatorPort);
  }
  return functions;
}

/**
 * App Check, in the browser only: each request to Firestore and the other
 * Firebase services carries a token showing it came from the real site.
 * Servers can't get one, which is why server-side reads use the Admin SDK
 * (src/lib/server-db.ts). On localhost, Firebase prints a debug token in
 * the browser console instead; register it in Firebase > App Check to test
 * locally once App Check is enforced.
 */
function startAppCheck(app: FirebaseApp) {
  if (appCheckStarted || typeof window === 'undefined' || !appCheckSiteKey || useEmulators) return;
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
  const auth = getAuth(app);
  if (useEmulators && !emulatorsConnected) {
    emulatorsConnected = true;
    connectFirestoreEmulator(firestore, '127.0.0.1', firestoreEmulatorPort);
    connectAuthEmulator(auth, `http://127.0.0.1:${authEmulatorPort}`, { disableWarnings: true });
  }

  // Conditionally initialize Analytics only on the client and if supported.
  const analytics = typeof window !== 'undefined' && firebaseConfig.measurementId 
    ? isSupported().then(yes => yes ? getAnalytics(app) : null)
    : Promise.resolve(null);

  return {
    firebaseApp: app,
    auth,
    firestore: firestore,
    analytics,
  };
}
