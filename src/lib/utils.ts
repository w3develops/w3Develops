
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp, FieldValue } from "firebase/firestore";
import { UserProfile, UserStatus } from "./types";
import { ONE_WEEK_IN_MS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp: Timestamp | FieldValue | undefined | null, includeTime = false) {
  if (!timestamp || !(timestamp instanceof Timestamp)) {
    return 'N/A';
  }

  const date = timestamp.toDate();
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  if (includeTime) {
    options.hour = 'numeric';
    options.minute = '2-digit';
  }

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

export function timeAgo(timestamp: Timestamp | FieldValue | undefined | null): string {
  if (!timestamp || !(timestamp instanceof Timestamp)) return '';
  
  const now = new Date();
  const secondsPast = (now.getTime() - timestamp.toDate().getTime()) / 1000;

  if (secondsPast < 60) {
    return `${Math.round(secondsPast)}s ago`;
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

/**
 * Converts a UTC start time (HH:mm) to the user's local time string based on their numeric offset.
 * @param startTimeUTC The 24-hour time string in UTC (e.g., "14:00").
 * @param userOffset The user's UTC offset in hours (e.g., -5, 2.5).
 * @returns A formatted string like "9:00 AM (Your Local Time)".
 */
export function convertUTCToLocal(startTimeUTC: string, userOffset: number): string {
  if (!startTimeUTC) return 'TBD';
  
  const [hours, minutes] = startTimeUTC.split(':').map(Number);
  
  // Create a Date object set to today at the UTC time
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);
  
  // Apply the user's offset (offset is in hours)
  // userOffset is what the user provides (e.g., Florida = -4)
  // We need to calculate the actual timestamp
  const offsetInMs = userOffset * 60 * 60 * 1000;
  const localTimestamp = date.getTime() + offsetInMs;
  const localDate = new Date(localTimestamp);

  return localDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }) + ' (Local)';
}

/**
 * Normalizes a local time choice to UTC based on the creator's offset.
 */
export function normalizeToUTC(localTime: string, userOffset: number): string {
  const [hours, minutes] = localTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  // Subtract offset to get back to UTC
  const utcDate = new Date(date.getTime() - (userOffset * 60 * 60 * 1000));
  
  const h = utcDate.getUTCHours().toString().padStart(2, '0');
  const m = utcDate.getUTCMinutes().toString().padStart(2, '0');
  
  return `${h}:${m}`;
}
