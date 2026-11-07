import { Timestamp } from 'firebase/firestore';

// Firestore documents fetched on the server are handed to browser components
// as their first data. React can only pass plain values across, so
// Timestamps travel as { __timestamp: milliseconds } and are rebuilt here.

const TIMESTAMP_KEY = '__timestamp';

/** On the server: a document with its Timestamps made plain */
export function toPlain(value: unknown): unknown {
  if (value instanceof Timestamp) return { [TIMESTAMP_KEY]: value.toMillis() };
  if (Array.isArray(value)) return value.map(toPlain);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, toPlain(inner)]));
  }
  return value;
}

/** In the browser: the document with its Timestamps back */
export function fromPlain<T>(value: unknown): T {
  if (Array.isArray(value)) return value.map(inner => fromPlain(inner)) as T;
  if (value && typeof value === 'object') {
    const millis = (value as Record<string, unknown>)[TIMESTAMP_KEY];
    if (typeof millis === 'number') return Timestamp.fromMillis(millis) as T;
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, fromPlain(inner)])) as T;
  }
  return value as T;
}
