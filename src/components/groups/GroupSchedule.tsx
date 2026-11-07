'use client';

import { useIsClient } from '@/lib/hooks/useClientValues';
import { Clock } from 'lucide-react';
import { Group } from '@/lib/types';
import { describeSchedule } from '@/lib/timezones';

/** When the group meets, in the viewer's own time */
export default function GroupSchedule({ group, className }: { group: Group; className?: string }) {
  // Shown once the page runs in the browser, since the server doesn't know the viewer's timezone
  const isClient = useIsClient();
  if (!isClient) return null;

  let text: string | null = null;
  if (group.startTime && group.timezone) {
    text = `${describeSchedule(group.commitmentDays, group.startTime, group.timezone)} your time`;
  } else if (group.commitmentDays?.length) {
    text = group.commitmentDays.join(', ');
  }
  if (!text) return null;
  return (
    <div className={className ?? 'flex items-center gap-2'}>
      <Clock className="h-4 w-4" /> {text}
    </div>
  );
}
