'use client';

import { useBrowserTimeZone } from '@/lib/hooks/useClientValues';

/**
 * Text that depends on the viewer's time zone, like a date or time. The
 * server doesn't know the viewer's zone, so the page's HTML (what search
 * engines read) and the browser's first render show it in UTC; it then
 * switches to the viewer's own zone.
 */
export default function ZonedText({ render }: { render: (timeZone: string) => string }) {
  const timeZone = useBrowserTimeZone() || 'UTC';
  return <>{render(timeZone)}</>;
}
