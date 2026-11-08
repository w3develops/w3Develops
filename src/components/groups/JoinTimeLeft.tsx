'use client';

import { Hourglass } from 'lucide-react';
import type { Group } from '@/lib/types';
import { joinTimeLeft } from '@/lib/groups';
import { useNow } from '@/lib/hooks/useClientValues';
import { cn } from '@/lib/utils';

/**
 * "3 days left to join" while a group takes new members. Shown only in the
 * browser, since the server's copy of the page can be minutes old.
 */
export default function JoinTimeLeft({ group, className }: { group: Group; className?: string }) {
  const now = useNow();
  const text = now === null ? null : joinTimeLeft(group, now);
  if (!text) return null;
  return (
    <div className={cn('flex items-center text-sm font-medium text-primary', className)}>
      <Hourglass className="w-4 h-4 mr-2" aria-hidden="true" /> {text}
    </div>
  );
}
