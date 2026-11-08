
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import type { NewsBrief } from '@/lib/news-brief';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getErrorMessage } from '@/lib/utils';

/**
 * The AI community briefing. Pass `initialBrief` when the server already
 * loaded it (null if it couldn't); left out, the briefing loads in the browser.
 */
export default function AiNewsSummary({ initialBrief }: { initialBrief?: NewsBrief | null }) {
  const fromServer = initialBrief !== undefined;
  const [brief, setBrief] = useState<NewsBrief | null>(initialBrief ?? null);
  const [isLoading, setIsLoading] = useState(!fromServer);
  const [error, setError] = useState<string | null>(
    fromServer && !initialBrief ? 'The briefing is unavailable right now. Please try again in a few minutes.' : null,
  );

  useEffect(() => {
    if (fromServer) return;
    const getBrief = async () => {
      try {
        const res = await fetch('/api/news/brief');
        if (!res.ok) throw new Error('Failed to load today\'s briefing.');
        setBrief(await res.json());
      } catch (err) {
        console.error("News brief failed to load:", err);
        setError(getErrorMessage(err, "Failed to load today's briefing."));
      } finally {
        setIsLoading(false);
      }
    };

    getBrief();
  }, [fromServer]);

  return (
    <Card className="border-2 border-primary/20 bg-primary/5 mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5 fill-primary" />
          AI Community Briefing
        </CardTitle>
        <CardDescription>
          {brief
            ? `${brief.date} · Headlines ${brief.rankedBy === 'jev'
                ? 'sorted and ranked by Jev'
                : 'sorted by keyword'}`
            : 'A digest of tech news for the w3Develops community.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse font-medium">Reading through today's headlines...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Briefing Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        ) : brief ? (
          <div className="space-y-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-base leading-relaxed text-foreground">
                {brief.summary}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-bold text-sm uppercase tracking-wider text-primary">Key Takeaways</h4>
                <ul className="space-y-3">
                  {brief.highlights.map((story) => (
                    <li key={story.link} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <div>
                        <a
                          href={story.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline"
                        >
                          {story.title}
                        </a>
                        <p className="text-xs text-muted-foreground">
                          {story.topicLabel} · {story.source}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3 bg-background/50 p-4 rounded-lg border">
                <h4 className="font-bold text-sm uppercase tracking-wider text-primary">State of the Community</h4>
                <p className="text-sm italic leading-relaxed">
                  {brief.stateOfTheCommunity}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
