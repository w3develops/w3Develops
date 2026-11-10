'use client';

import ZonedText from '@/components/ZonedText';
import { formatPostTime } from '@/lib/post-view';

/** A post's date, or a time in it, in the reader's time zone (UTC on the server) */
export default function PostTime({ ms, withTime = false }: { ms: number; withTime?: boolean }) {
  return (
    <time dateTime={new Date(ms).toISOString()}>
      <ZonedText render={timeZone => formatPostTime(ms, timeZone, withTime)} />
    </time>
  );
}
