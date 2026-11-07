
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp, FieldValue } from "firebase/firestore";
import { UserProfile, UserStatus } from "./types";
import { ONE_WEEK_IN_MS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** The code of a Firebase error, like "auth/wrong-password", or "" for anything else */
export function getErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return '';
}

/** A caught error's message, or the fallback when there isn't one */
export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred.'): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/** `timeZone` defaults to the one the code runs in; pass one to name it next to the time */
export function formatTimestamp(timestamp: Timestamp | FieldValue | undefined | null, includeTime = false, timeZone?: string) {
  if (!timestamp || !(timestamp instanceof Timestamp)) {
    return 'N/A';
  }

  const date = timestamp.toDate();
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone,
  };

  if (includeTime) {
    options.hour = 'numeric';
    options.minute = '2-digit';
    if (timeZone) options.timeZoneName = 'short';
  }

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

export function timeAgo(timestamp: Timestamp | FieldValue | undefined | null, now: number = Date.now()): string {
  if (!timestamp || !(timestamp instanceof Timestamp)) return '';

  const secondsPast = (now - timestamp.toDate().getTime()) / 1000;

  // Callers may pass a clock that only ticks every minute, so anything newer
  // than that (even slightly "in the future") is just now
  if (secondsPast < 60) {
    return 'just now';
  }
  if (secondsPast < 3600) {
    return `${Math.round(secondsPast / 60)}m ago`;
  }
  if (secondsPast <= 86400) {
    return `${Math.round(secondsPast / 3600)}h ago`;
  }
  if (secondsPast <= 2592000) { // 30 days
    const days = Math.round(secondsPast / 86400);
    return `${days}d ago`;
  }
  
  return formatTimestamp(timestamp);
}

export function getDerivedUserStatus(member: UserProfile): UserStatus {
    if (!member.lastCheckInAt) {
        return member.status || 'inactive';
    }
    const lastCheckInTime = (member.lastCheckInAt as Timestamp)?.toMillis();

    if (!lastCheckInTime) {
        return member.status || 'inactive';
    }
    
    const oneWeekAgo = Date.now() - ONE_WEEK_IN_MS;
    const twoWeeksAgo = Date.now() - 2 * ONE_WEEK_IN_MS;

    if (lastCheckInTime < twoWeeksAgo) return 'inactive';
    if (lastCheckInTime < oneWeekAgo) return 'paused';
    return member.status || 'active';
}
