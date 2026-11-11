'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Timestamp, collection, limit, orderBy, query, where } from 'firebase/firestore';
import { CalendarPlus, MapPin, Trophy, Users, Video } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBrowserTimeZone, useNow } from '@/lib/hooks/useClientValues';
import type { Competition, Meetup } from '@/lib/types';

const STARTED_GRACE_MS = 4 * 60 * 60 * 1000;
const MEETUP_LENGTH_MS = 2 * 60 * 60 * 1000;

type Kind = 'meetup' | 'competition';

interface CalendarEvent {
  key: string;
  kind: Kind;
  title: string;
  description: string;
  start: Date;
  end: Date;
  link: string;
  where: string;
  online: boolean;
  people?: number;
}

const millis = (value: unknown) => (value instanceof Timestamp ? value.toMillis() : null);

/** "Today", "Tomorrow", or "Saturday, November 14" in the viewer's zone */
function dayHeading(date: Date, timeZone: string, now: number): string {
  const key = (d: Date) => d.toLocaleDateString('en-CA', { timeZone });
  if (key(date) === key(new Date(now))) return 'Today';
  if (key(date) === key(new Date(now + 86_400_000))) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { timeZone, weekday: 'long', month: 'long', day: 'numeric' });
}

function timeLabel(date: Date, timeZone: string): string {
  return date.toLocaleTimeString('en-US', { timeZone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
}

/** An .ics file for one event, so people can add it to their own calendar */
function icsHref(event: CalendarEvent): string {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const escape = (text: string) => text.replace(/\\/g, '\\\\').replace(/[,;]/g, m => `\\${m}`).replace(/\r?\n/g, '\\n');
  const url = `https://w3develops.org${event.link}`;
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//w3Develops//Events//EN', 'BEGIN:VEVENT',
    `UID:${event.key}@w3develops.org`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(event.start)}`, `DTEND:${stamp(event.end)}`,
    `SUMMARY:${escape(event.title)}`, `DESCRIPTION:${escape(`${event.description.slice(0, 500)}\n\n${url}`)}`,
    `LOCATION:${escape(event.online ? url : event.where)}`, `URL:${url}`, 'END:VEVENT', 'END:VCALENDAR',
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`;
}

/** Upcoming meetups and competitions as one agenda, grouped by day; `initial*` are the server's copies */
export default function EventsCalendar({ initialMeetups, initialCompetitions }: { initialMeetups: unknown[] | null; initialCompetitions: unknown[] | null }) {
  const firestore = useFirestore();
  const timeZone = useBrowserTimeZone() || 'UTC';
  const now = useNow();
  const [filter, setFilter] = useState<Kind | null>(null);

  // The queries' time cutoffs only move when the page loads, so they stay cached
  const [loadedAt] = useState(() => Date.now());
  const meetupsQuery = useMemo(() => query(collection(firestore, 'meetups'), where('dateTime', '>=', Timestamp.fromMillis(loadedAt - STARTED_GRACE_MS)), orderBy('dateTime', 'asc'), limit(100)), [firestore, loadedAt]);
  const competitionsQuery = useMemo(() => query(collection(firestore, 'competitions'), where('endDate', '>=', Timestamp.fromMillis(loadedAt)), orderBy('endDate', 'asc'), limit(50)), [firestore, loadedAt]);
  const { data: meetups } = useCollection<Meetup>(meetupsQuery, initialMeetups);
  const { data: competitions } = useCollection<Competition>(competitionsQuery, initialCompetitions);

  const events = useMemo(() => {
    const list: CalendarEvent[] = [];
    for (const meetup of meetups ?? []) {
      const start = millis(meetup.dateTime);
      if (start === null) continue;
      list.push({
        key: `meetup-${meetup.id}`, kind: 'meetup', title: meetup.name, description: meetup.description ?? '',
        start: new Date(start), end: new Date(start + MEETUP_LENGTH_MS), link: `/meetups/${meetup.id}`,
        where: meetup.locationType === 'Online' ? 'Online' : meetup.locationAddress || meetup.locationType,
        online: meetup.locationType === 'Online', people: meetup.attendeeIds?.length ?? 0,
      });
    }
    for (const competition of competitions ?? []) {
      const start = millis(competition.startDate);
      const end = millis(competition.endDate);
      if (start === null || end === null) continue;
      list.push({
        key: `competition-${competition.id}`, kind: 'competition', title: competition.name, description: competition.description ?? '',
        // A competition already running is listed today, until it ends
        start: new Date(Math.max(start, Math.min(loadedAt, end))), end: new Date(end), link: `/competitions/${competition.id}`,
        where: 'Online', online: true,
      });
    }
    return list.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [meetups, competitions, loadedAt]);

  const shown = events.filter(event => !filter || event.kind === filter);
  const byDay = new Map<string, CalendarEvent[]>();
  for (const event of shown) {
    const heading = dayHeading(event.start, timeZone, now ?? loadedAt);
    byDay.set(heading, [...(byDay.get(heading) ?? []), event]);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-10 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-headline">Events</h1>
          <p className="text-muted-foreground">Upcoming meetups and competitions from the w3Develops community, in your time zone.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild><Link href="/meetups/create">Host a meetup</Link></Button>
          <Button asChild variant="outline"><Link href="/competitions/create">Start a competition</Link></Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
        {([[null, 'Everything'], ['meetup', 'Meetups'], ['competition', 'Competitions']] as const).map(([value, label]) => (
          <Button key={label} size="sm" variant={filter === value ? 'default' : 'outline'} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</Button>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="text-muted-foreground">
          Nothing coming up yet. <Link href="/meetups/create" className="underline">Host a meetup</Link> or see{' '}
          <Link href="/hackathons" className="underline">hackathons</Link> from around the web.
        </p>
      )}

      {[...byDay.entries()].map(([heading, dayEvents]) => (
        <section key={heading} aria-label={heading} className="space-y-3">
          <h2 className="sticky top-14 z-10 bg-background/95 py-1 text-lg font-semibold">{heading}</h2>
          {dayEvents.map(event => (
            <Card key={event.key}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start">
                <div className="w-28 shrink-0 text-sm text-muted-foreground">
                  {event.kind === 'competition' ? `Until ${event.end.toLocaleDateString('en-US', { timeZone, month: 'short', day: 'numeric' })}` : timeLabel(event.start, timeZone)}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={event.link} className="font-semibold hover:underline">{event.title}</Link>
                    <Badge variant={event.kind === 'competition' ? 'default' : 'secondary'} className="gap-1">
                      {event.kind === 'competition' ? <Trophy className="h-3 w-3" aria-hidden="true" /> : <Users className="h-3 w-3" aria-hidden="true" />}
                      {event.kind === 'competition' ? 'Competition' : 'Meetup'}
                    </Badge>
                  </div>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    {event.online ? <Video className="h-3 w-3" aria-hidden="true" /> : <MapPin className="h-3 w-3" aria-hidden="true" />}
                    {event.where}
                    {event.people ? ` · ${event.people} going` : ''}
                  </p>
                  {event.description && <p className="line-clamp-2 text-sm">{event.description}</p>}
                </div>
                <Button asChild size="sm" variant="ghost" className="self-start">
                  <a href={icsHref(event)} download={`${event.key}.ics`}><CalendarPlus className="mr-1 h-4 w-4" aria-hidden="true" />Add to calendar</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      ))}
    </div>
  );
}
