// Server code only. Reads public Firestore data for server-rendered pages,
// the sitemap and the RSS feed.
//
// On Google Cloud (App Hosting sets FIREBASE_CONFIG for builds and the live
// site) this uses the Admin SDK with the site's own service account, so the
// reads keep working when App Check is enforced: a server can't pass the
// browser's App Check. The Admin SDK skips the Firestore rules, so only
// public collections and public profile fields may be read through here
// (see src/lib/public-items.ts).
//
// Elsewhere, like a local build without Google credentials, it falls back to
// the browser SDK reading as an anonymous visitor, as before.
import { getApps as getAdminApps, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, Timestamp as AdminTimestamp, type Query as AdminQuery } from 'firebase-admin/firestore';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, Timestamp, where, type QueryConstraint } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { initializeFirebase } from '@/firebase/initialize-app';

export interface ServerDoc {
  id: string;
  data: Record<string, unknown>;
}

export interface ServerQuery {
  collection: string;
  where?: { field: string; op: '<' | '<=' | '>' | '>='; millis: number };
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit: number;
}

const onGoogleCloud = () => !!process.env.FIREBASE_CONFIG;

function adminDb() {
  if (getAdminApps().length === 0) initializeAdminApp({ projectId: firebaseConfig.projectId });
  return getAdminFirestore();
}

// Admin Timestamps become the browser SDK's Timestamps, which the rest of
// the site (and toPlain) expects
function toClientTypes(value: unknown): unknown {
  if (value instanceof AdminTimestamp) return Timestamp.fromMillis(value.toMillis());
  if (Array.isArray(value)) return value.map(toClientTypes);
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, toClientTypes(inner)]));
  }
  return value;
}

/** One document, or null if it doesn't exist */
export async function readDoc(collectionName: string, id: string): Promise<ServerDoc | null> {
  if (onGoogleCloud()) {
    const snap = await adminDb().collection(collectionName).doc(id).get();
    return snap.exists ? { id: snap.id, data: toClientTypes(snap.data()) as Record<string, unknown> } : null;
  }
  const snap = await getDoc(doc(initializeFirebase().firestore, collectionName, id));
  return snap.exists() ? { id: snap.id, data: snap.data() } : null;
}

/** Documents from one collection, optionally filtered by a time and sorted */
export async function readList(list: ServerQuery): Promise<ServerDoc[]> {
  if (onGoogleCloud()) {
    let q: AdminQuery = adminDb().collection(list.collection);
    if (list.where) q = q.where(list.where.field, list.where.op, AdminTimestamp.fromMillis(list.where.millis));
    if (list.orderBy) q = q.orderBy(list.orderBy.field, list.orderBy.direction);
    const snap = await q.limit(list.limit).get();
    return snap.docs.map(d => ({ id: d.id, data: toClientTypes(d.data()) as Record<string, unknown> }));
  }
  const constraints: QueryConstraint[] = [];
  if (list.where) constraints.push(where(list.where.field, list.where.op, Timestamp.fromMillis(list.where.millis)));
  if (list.orderBy) constraints.push(orderBy(list.orderBy.field, list.orderBy.direction));
  constraints.push(limit(list.limit));
  const snap = await getDocs(query(collection(initializeFirebase().firestore, list.collection), ...constraints));
  return snap.docs.map(d => ({ id: d.id, data: d.data() }));
}
