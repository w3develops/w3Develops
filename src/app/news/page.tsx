
'use client';

import { useState, useEffect } from 'react';
import { fetchNews, NewsArticle } from '@/ai/flows/fetch-news-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function NewsCardSkeleton() {
    return (
        <Card className="animate-pulse">
            <CardHeader>
                <div className="h-5 w-3/4 bg-muted rounded"></div>
                <div className="h-4 w-1/3 bg-muted rounded mt-2"></div>
            </CardHeader>
        </Card>
    )
}

export default function NewsPage() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [recentArticles, setRecentArticles] = useState<NewsArticle[]>([]);

    useEffect(() => {
        const getArticles = async () => {
            setIsLoading(true);
            try {
                const fetchedArticles = await fetchNews();
                const sortedArticles = fetchedArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
                setArticles(sortedArticles);
            } catch (error) {
                console.error("Failed to fetch news:", error);
            } finally {
                setIsLoading(false);
            }
        };
        getArticles();
    }, []);

    useEffect(() => {
        if (articles.length > 0) {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            const filtered = articles.filter(article => new Date(article.pubDate) >= threeDaysAgo);
            setRecentArticles(filtered);
        }
    }, [articles]);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-8">
            <header className="space-y-4">
                <h1 className="text-4xl font-headline font-bold">Latest News</h1>
                <p className="text-muted-foreground">The latest headlines from The Register, updated daily.</p>
            </header>
            
            {isLoading ? (
                <div className="space-y-6">
                    <NewsCardSkeleton />
                    <NewsCardSkeleton />
                    <NewsCardSkeleton />
                </div>
            ) : recentArticles.length > 0 ? (
                <div className="space-y-6">
                    {recentArticles.map((article) => (
                        <Card key={article.guid}>
                            <CardHeader>
                                <CardTitle>
                                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                        {article.title}
                                    </a>
                                </CardTitle>
                                <CardDescription>
                                    {new Date(article.pubDate).toLocaleString()}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">No recent news available.</p>
                    </CardContent>
                </Card>
            )}

            <div className="text-center pt-4">
                <Button asChild>
                    <Link href="/news/archive">View Older Posts</Link>
                </Button>
            </div>
        </div>
    );
}
