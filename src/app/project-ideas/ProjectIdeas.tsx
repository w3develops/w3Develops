'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { IDEA_LEVELS, IDEA_TRACKS, PROJECT_IDEAS, type IdeaLevel, type IdeaTrack } from '@/lib/project-ideas';

function FilterButtons<T extends string>({ label, options, value, onChange }: { label: string; options: Record<T, string>; value: T | null; onChange: (value: T | null) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <Button size="sm" variant={value === null ? 'default' : 'outline'} onClick={() => onChange(null)} aria-pressed={value === null}>All</Button>
      {(Object.entries(options) as [T, string][]).map(([key, name]) => (
        <Button key={key} size="sm" variant={value === key ? 'default' : 'outline'} onClick={() => onChange(key)} aria-pressed={value === key}>{name}</Button>
      ))}
    </div>
  );
}

/** Project ideas by level and track, each leading to a solo or group project */
export default function ProjectIdeas() {
  const [level, setLevel] = useState<IdeaLevel | null>(null);
  const [track, setTrack] = useState<IdeaTrack | null>(null);
  const shown = PROJECT_IDEAS.filter(idea => (!level || idea.level === level) && (!track || idea.track === track));

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-6">
      <div>
        <h1 className="text-3xl font-headline">Project Ideas</h1>
        <p className="text-muted-foreground max-w-3xl">
          Not sure what to build? Pick an idea at your level, build it as a <Link href="/solo-projects" className="underline">solo project</Link>,
          or start a <Link href="/groupprojects" className="underline">group project</Link> and build it with others. Ideas marked
          &ldquo;Good for a team&rdquo; have enough parts to split up.
        </p>
      </div>

      <div className="space-y-2">
        <FilterButtons label="Level" options={IDEA_LEVELS} value={level} onChange={setLevel} />
        <FilterButtons label="Track" options={IDEA_TRACKS} value={track} onChange={setTrack} />
      </div>

      {shown.length === 0 && <p className="text-muted-foreground">No ideas match those filters yet.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map(idea => (
          <Card key={idea.slug} id={idea.slug} className="flex flex-col scroll-mt-20">
            <CardContent className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary">{IDEA_LEVELS[idea.level]}</Badge>
                <Badge variant="outline">{IDEA_TRACKS[idea.track]}</Badge>
                {idea.team && <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" aria-hidden="true" />Good for a team</Badge>}
              </div>
              <h2 className="font-semibold">{idea.title}</h2>
              <p className="text-sm text-muted-foreground">{idea.summary}</p>
              <div>
                <p className="text-xs font-medium">You&apos;ll learn</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {idea.learn.map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Button asChild size="sm" variant="outline"><Link href="/solo-projects">Build it solo</Link></Button>
                <Button asChild size="sm"><Link href="/groupprojects/create">Start a group project</Link></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Want more? <a href="https://roadmap.sh/projects" target="_blank" rel="noopener noreferrer" className="underline">roadmap.sh/projects</a> has
        hundreds of project ideas with step-by-step requirements.
      </p>
    </div>
  );
}
