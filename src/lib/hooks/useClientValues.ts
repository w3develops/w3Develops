'use client';

import { useSyncExternalStore } from 'react';
import { browserTimeZone } from '@/lib/timezones';
import { JOIN_WINDOW_MS } from '@/lib/constants';

// Values only the browser knows. While the server renders the page, and while
// the browser first takes it over, these return their "unknown" value so both
// agree; React then re-renders with the real value.

const neverChanges = () => () => {};

/** False while the server renders the page and during hydration, true after */
export function useIsClient(): boolean {
  return useSyncExternalStore(neverChanges, () => true, () => false);
}

/** The viewer's timezone, or '' before the page is running in the browser */
export function useBrowserTimeZone(): string {
  return useSyncExternalStore(neverChanges, browserTimeZone, () => '');
}

// One shared clock that ticks every minute while any component is watching it
let now = Date.now();
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function watchClock(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach(notify => notify());
    }, 60_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** The current time in milliseconds, updated every minute; null before the page is running in the browser */
export function useNow(): number | null {
  return useSyncExternalStore(watchClock, () => now, () => null);
}

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

/**
 * The time a join window ago (two weeks), in milliseconds: groups created
 * after it are still taking members unless they set a start date. Rounded
 * down to the hour so a query built from it stays the same for an hour; null
 * before the page is running in the browser.
 */
export function useJoinWindowStart(): number | null {
  const current = useNow();
  if (current === null) return null;
  return Math.floor((current - JOIN_WINDOW_MS) / ONE_HOUR_IN_MS) * ONE_HOUR_IN_MS;
}
