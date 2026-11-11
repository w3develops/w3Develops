import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ARTICLE_TOPICS } from '@/lib/articles';

export interface ArticleSummary {
  id: string;
  title: string;
  summary: string;
  topic: keyof typeof ARTICLE_TOPICS;
  authorName: string;
}

/** The newest published member articles on /news, with a link to write one */
export default function CommunityArticles({ articles }: { articles: ArticleSummary[] }) {
  return (
    <section aria-labelledby="community-articles-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="community-articles-heading" className="text-xl font-bold font-headline">From the community</h2>
        <Button asChild size="sm" variant="outline"><Link href="/news/write"><PenLine className="mr-2 h-4 w-4" aria-hidden="true" />Write for w3Develops</Link></Button>
      </div>
      {articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No member articles yet. <Link href="/news/write" className="underline">Apply to write the first one.</Link></p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map(article => (
            <Card key={article.id}>
              <CardContent className="space-y-2 p-4">
                <Badge variant="secondary">{ARTICLE_TOPICS[article.topic] ?? article.topic}</Badge>
                <Link href={`/news/articles/${article.id}`} className="block font-semibold hover:underline">{article.title}</Link>
                <p className="line-clamp-3 text-sm text-muted-foreground">{article.summary}</p>
                <p className="text-xs text-muted-foreground">by {article.authorName}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
