
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
