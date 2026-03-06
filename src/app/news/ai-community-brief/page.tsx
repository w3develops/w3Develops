
'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AiNewsSummary from '@/components/AiNewsSummary';

interface Post {
  title: string;
  link: string;
  isoDate: string;
  source: string;
}

export default function AiCommunityBriefPage() {
    const [newsItems, setNewsItems] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const fetchNews = async () => {
        try {
          setIsLoading(true);
          const res = await fetch('/api/news');
          if (!res.ok) throw new Error('Failed to fetch news');
          const data: Post[] = await res.json();
          setNewsItems(data);
        } catch (error) {
          console.error("Error fetching news for AI summary:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchNews();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-8">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="sm" className="hover:bg-accent">
                    <Link href="/news" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to News Feed
                    </Link>
                </Button>
            </div>

            <div className="text-center space-y-4">
                <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto">
                    <Sparkles className="h-10 w-10 text-primary fill-primary" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-headline font-bold">
                        Daily AI Community Briefing
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Your personalized window into today's tech trends, community growth, and actionable inspiration.
                    </p>
                </div>
            </div>

            <div className="pt-4">
                {isLoading ? (
                    <Card className="p-16 border-dashed">
                        <div className="flex flex-col items-center justify-center space-y-6 text-center">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <div className="space-y-2">
                                <p className="text-xl font-bold font-headline animate-pulse">Reading through today's headlines...</p>
                                <p className="text-sm text-muted-foreground">Gemini AI is synthesizing community and tech news into your daily briefing.</p>
                            </div>
                        </div>
                    </Card>
                ) : newsItems.length > 0 ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <AiNewsSummary articles={newsItems} />
                    </div>
                ) : (
                    <Card className="p-12 text-center bg-muted/20">
                        <p className="text-muted-foreground">No news articles found to summarize today. Check back shortly!</p>
                    </Card>
                )}
            </div>

            <footer className="pt-12 text-center border-t border-muted">
                <p className="text-sm text-muted-foreground">
                    Powered by Genkit and Gemini Flash 1.5. This summary is generated daily based on activity and global tech feeds.
                </p>
            </footer>
        </div>
    );
}
