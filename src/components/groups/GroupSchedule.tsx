'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Group } from '@/lib/types';
import { describeSchedule } from '@/lib/timezones';

/** When the group meets, in the viewer's own time */
export default function GroupSchedule({ group, className }: { group: Group; className?: string }) {
  // Computed after mount, since the server doesn't know the viewer's timezone
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (group.startTime && group.timezone) {
      setText(`${describeSchedule(group.commitmentDays, group.startTime, group.timezone)} your time`);
    } else if (group.commitmentDays?.length) {
      setText(group.commitmentDays.join(', '));
    }
  }, [group.commitmentDays, group.startTime, group.timezone]);

  if (!text) return null;
  return (
    <div className={className ?? 'flex items-center gap-2'}>
      <Clock className="h-4 w-4" /> {text}
    </div>
  );
}
