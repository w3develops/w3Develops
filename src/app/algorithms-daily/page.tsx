import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pageMetadata } from '@/lib/site-pages';
import { dayLabel, problemForDay, utcDay } from '@/lib/algorithms-daily';

// A new problem each day at midnight UTC; rebuilt at least hourly so the
// switch shows up soon after
export const revalidate = 3600;

export const metadata: Metadata = pageMetadata('/algorithms-daily');

const ARCHIVE_DAYS = 7;

/** Today's UTC day number, read when the server renders the page */
function currentDay(): number {
  return utcDay(Date.now());
}

export default function AlgorithmsDailyPage() {
  const today = currentDay();
  const problem = problemForDay(today);
  const past = Array.from({ length: ARCHIVE_DAYS }, (_, i) => today - 1 - i);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-10 space-y-6">
      <div>
        <h1 className="text-3xl font-headline">Algorithms Daily</h1>
        <p className="text-muted-foreground">
          One classic coding problem a day, the same for everyone, changing at midnight UTC. Try it, share your approach on the{' '}
          <Link href="/feed" className="underline">community feed</Link> with #algorithmsdaily, and follow{' '}
          <a href="https://x.com/algorithmsdaily" target="_blank" rel="noopener noreferrer" className="underline">@algorithmsdaily</a> on X.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Problem for {dayLabel(today)} (UTC)</CardDescription>
          <CardTitle as="h2" className="text-2xl">{problem.title}</CardTitle>
          <div className="flex flex-wrap gap-1 pt-1">
            <Badge variant={problem.difficulty === 'Hard' ? 'destructive' : problem.difficulty === 'Medium' ? 'default' : 'secondary'}>{problem.difficulty}</Badge>
            {problem.topics.map(topic => <Badge key={topic} variant="outline">{topic}</Badge>)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{problem.statement}</p>
          <div>
            <p className="text-sm font-medium">Example</p>
            <pre className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{problem.example}</pre>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Hints</p>
            {problem.hints.map((hint, i) => (
              <details key={hint} className="rounded-md border p-2 text-sm">
                <summary className="cursor-pointer">Hint {i + 1}</summary>
                <p className="mt-1 text-muted-foreground">{hint}</p>
              </details>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link href="/feed">Share your solution</Link></Button>
            <Button asChild variant="outline"><Link href="/studygroups">Find a study group</Link></Button>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="past-heading" className="space-y-2">
        <h2 id="past-heading" className="text-lg font-semibold">The past week</h2>
        <ul className="divide-y rounded-md border">
          {past.map(day => {
            const item = problemForDay(day);
            return (
              <li key={day} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <span><span className="text-muted-foreground">{dayLabel(day)}</span> · {item.title}</span>
                <Badge variant="outline">{item.difficulty}</Badge>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
