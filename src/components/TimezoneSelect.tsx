'use client';

import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { allTimeZones, timeZoneLabel } from '@/lib/timezones';

export default function TimezoneSelect({ value, onChange, id, disabled }: {
  value: string;
  onChange: (timeZone: string) => void;
  id?: string;
  disabled?: boolean;
}) {
  const zones = useMemo(() => {
    const list = allTimeZones();
    return list.includes(value) || !value ? list : [value, ...list];
  }, [value]);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id}><SelectValue placeholder="Select your timezone" /></SelectTrigger>
      <SelectContent className="max-h-72">
        {zones.map(tz => (
          <SelectItem key={tz} value={tz}>{timeZoneLabel(tz)} · {tz}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
