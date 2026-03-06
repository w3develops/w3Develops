
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { generateDailyNewsSummary, type NewsSummaryOutput } from '@/ai/flows/news-summary-flow';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AiNewsSummaryProps {
  articles: { title: string; link: string; source: string }[];
}

export default function AiNewsSummary({ articles }: AiNewsSummaryProps) {
  const [summary, setSummary] = useState<NewsSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getSummary = async () => {
      if (articles.length === 0) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const today = new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

        const result = await generateDailyNewsSummary({
          articles: articles.slice(0, 15),
          today
        });
        
        setSummary(result);
      } catch (err: any) {
        console.error("AI Summary generation failed:", err);
        setError(err.message || "Failed to generate AI summary.");
      } finally {
        setIsLoading(false);
      }
    };

    getSummary();
  }, [articles]);

  if (!isLoading && !summary && !error) return null;

  return (
    <Card className="border-2 border-primary/20 bg-primary/5 mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5 fill-primary" />
          AI Community Briefing
        </CardTitle>
        <CardDescription>
          Gemini AI's daily digest of tech news and w3Develops activity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse font-medium">Synthesizing news into actionable insights...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Summary Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        ) : summary ? (
          <div className="space-y-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-base leading-relaxed text-foreground">
                {summary.summary}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-bold text-sm uppercase tracking-wider text-primary">Key Takeaways</h4>
                <ul className="space-y-2">
                  {summary.highlights.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3 bg-background/50 p-4 rounded-lg border">
                <h4 className="font-bold text-sm uppercase tracking-wider text-primary">State of the Community</h4>
                <p className="text-sm italic leading-relaxed">
                  {summary.stateOfTheCommunity}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
