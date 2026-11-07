
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AiNewsSummary from '@/components/AiNewsSummary';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';

export const metadata: Metadata = pageMetadata('/news/ai-community-brief');

export default function AiCommunityBriefPage() {
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

            <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <AiNewsSummary />
            </div>

            <footer className="pt-12 text-center border-t border-muted">
                <p className="text-sm text-muted-foreground">
                    Headlines are sorted and ranked by TypeSafe's Jev model, then written up automatically. This briefing updates once a day from global tech feeds.
                </p>
            </footer>
        </div>
    );
}
