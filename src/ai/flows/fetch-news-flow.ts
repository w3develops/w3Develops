'use server';
/**
 * @fileOverview A flow to fetch and parse news from an RSS feed.
 *
 * - fetchNews - A function that fetches and parses news articles.
 * - NewsArticle - The type for a single news article.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { XMLParser } from 'fast-xml-parser';

const NewsArticleSchema = z.object({
  title: z.string().describe('The title of the news article.'),
  link: z.string().url().describe('The direct URL to the full article.'),
  pubDate: z.string().describe('The publication date of the article in string format.'),
  guid: z.string().describe('A unique identifier for the article.'),
});

export type NewsArticle = z.infer<typeof NewsArticleSchema>;

const FetchNewsOutputSchema = z.array(NewsArticleSchema);
export type FetchNewsOutput = z.infer<typeof FetchNewsOutputSchema>;

export async function fetchNews(): Promise<FetchNewsOutput> {
  return fetchNewsFlow();
}

const fetchNewsFlow = ai.defineFlow(
  {
    name: 'fetchNewsFlow',
    inputSchema: z.void(),
    outputSchema: FetchNewsOutputSchema,
  },
  async () => {
    try {
      const response = await fetch('https://www.theregister.com/headlines.rss');
      if (!response.ok) {
        throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
      }
      const xmlData = await response.text();
      
      const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix : "@_"
      });
      const parsed = parser.parse(xmlData);

      const items = parsed?.rss?.channel?.item || [];

      // Ensure items is an array
      const articleItems = Array.isArray(items) ? items : [items];

      const articles: NewsArticle[] = articleItems.map((item: any) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        guid: item.guid['#text'] || item.guid,
      }));

      return articles;
    } catch (error) {
      console.error('Error fetching or parsing RSS feed:', error);
      return [];
    }
  }
);
