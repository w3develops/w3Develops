'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rss } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Post {
  title: string;
  link: string;
  isoDate: string;
  source: string;
}

// Mock function for initial render, real data will be fetched on the client
async function getNews(): Promise<Post[]> {
    return [];
}

function formatDate(dateString: string) {
    if (!dateString) return 'No date';
    try {
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(dateString));
    } catch {
        return dateString;
    }
}

export default function NewsPage() {
    const [newsItems, setNewsItems] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const fetchNews = async () => {
        try {
          setIsLoading(true);
          const res = await fetch('/api/news');
          if (!res.ok) {
            throw new Error('Failed to fetch news');
          }
          const data: Post[] = await res.json();
          setNewsItems(data);
        } catch (error) {
          console.error("Error fetching news:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchNews();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="font-headline text-3xl flex items-center gap-3">
                                <Rss className="h-8 w-8" />
                                Latest News
                            </CardTitle>
                            <CardDescription>
                                Posts from the last 3 days, updated twice daily.
                            </CardDescription>
                        </div>
                        <Button asChild variant="link">
                           <Link href="/news/archive">View Archive</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-12">
                            <h3 className="text-xl font-semibold">Fetching latest articles...</h3>
                            <p className="text-muted-foreground mt-2">
                                This may take a moment.
                            </p>
                        </div>
                    ) : newsItems.length > 0 ? (
                        <div className="space-y-6">
                            {newsItems.map((item, index) => (
                                <div key={`${item.link}-${index}`} className="border-b pb-6 last:border-b-0 last:pb-0">
                                    <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">{item.source}</p>
                                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="block text-xl font-semibold hover:text-primary mt-1">
                                        {item.title}
                                    </a>
                                     <p className="text-sm text-muted-foreground mt-2">
                                        {formatDate(item.isoDate)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-12">
                            <h3 className="text-xl font-semibold">No Recent News Found</h3>
                            <p className="text-muted-foreground mt-2">
                                We couldn't find any articles from the last 3 days. Please check back later.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
