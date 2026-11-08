'use client';

import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { googleCalendarUrl } from '@/lib/calendar';
import { GROUP_KINDS, type GroupKind } from '@/lib/groups';
import { SITE_URL } from '@/lib/site-pages';
import type { Group } from '@/lib/types';

/** Opens Google Calendar with the group's meetings as a weekly event */
export default function AddToCalendarButton({ kind, group }: { kind: GroupKind; group: Group }) {
  const config = GROUP_KINDS[kind];
  // Checked here so groups with no schedule get no button; the link itself is
  // built on click, from the date at that moment
  const hasSchedule = googleCalendarUrl(group, { title: config.title, pageUrl: '', today: '2000-01-01' }) !== null;
  if (!hasSchedule) return null;

  const open = () => {
    const url = googleCalendarUrl(group, { title: `w3Develops ${config.title}`, pageUrl: `${SITE_URL}${config.path}/${group.id}` });
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button variant="outline" size="sm" onClick={open}>
      <CalendarPlus className="w-4 h-4 mr-2" aria-hidden="true" />Add to Google Calendar
    </Button>
  );
}
