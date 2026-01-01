
import { fetchNews, NewsArticle } from '@/ai/flows/fetch-news-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

async function getArticles() {
  const articles = await fetchNews();
  return articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}

export default async function NewsArchivePage() {
    const articles = await getArticles();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const olderArticles = articles.filter(article => new Date(article.pubDate) < threeDaysAgo);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-8">
            <header className="space-y-4">
                 <Button asChild variant="outline" size="sm">
                    <Link href="/news" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Recent News
                    </Link>
                </Button>
                <h1 className="text-4xl font-headline font-bold">News Archive</h1>
                <p className="text-muted-foreground">Articles older than 3 days.</p>
            </header>
            
            {olderArticles.length > 0 ? (
                <div className="space-y-6">
                    {olderArticles.map((article) => (
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
                        <p className="text-muted-foreground">No older articles found.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
