// Direct messages (/messages) are for members 18 and over. firestore.rules
// (match /ages, canMessage) enforces this from each member's birth date,
// which they enter once and can't change.

export const MESSAGE_MIN_AGE = 18;
export const MAX_MESSAGE_LENGTH = 2000;
/** Days in 18 years, counting leap days; the rules use the same number */
export const ADULT_DAYS = 6575;

/** The conversation between two members: their uids, sorted, joined by "_" */
export function conversationIdFor(a: string, b: string): string {
  return [a, b].sort().join('_');
}

/** Whether someone born at birthMillis is 18 at nowMillis, the way the rules count it */
export function isAdultAt(birthMillis: number, nowMillis: number): boolean {
  return birthMillis + ADULT_DAYS * 86_400_000 <= nowMillis;
}
