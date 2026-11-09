'use client';

import { Hourglass } from 'lucide-react';
import type { Group } from '@/lib/types';
import { joinTimeLeft } from '@/lib/groups';
import { useBrowserTimeZone, useNow } from '@/lib/hooks/useClientValues';
import { cn } from '@/lib/utils';

/**
 * "3 days left to join" while a group takes new members, with its start date
 * when the host set one ("Starts Nov 20 · 12 days left to join"). Shown only
 * in the browser, since the server's copy of the page can be minutes old and
 * doesn't know the viewer's time zone.
 */
export default function JoinTimeLeft({ group, className }: { group: Group; className?: string }) {
  const now = useNow();
  const viewerZone = useBrowserTimeZone();
  const left = now === null ? null : joinTimeLeft(group, now);
  if (!left) return null;
  const starts = group.startDate && !group.openToJoinAnytime && viewerZone
    ? `Starts ${group.startDate.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: viewerZone })} · `
    : '';
  const text = `${starts}${left}`;
  return (
    <div className={cn('flex items-center text-sm font-medium text-primary', className)}>
      <Hourglass className="w-4 h-4 mr-2" aria-hidden="true" /> {text}
    </div>
  );
}
