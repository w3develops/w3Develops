
'use server';
/**
 * @fileOverview A flow to generate a daily AI news summary for the w3Develops community.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NewsSummaryInputSchema = z.object({
  articles: z.array(z.object({
    title: z.string(),
    link: z.string(),
    source: z.string(),
  })).describe('A list of recent news articles collected from community and tech RSS feeds.'),
  today: z.string().describe('The current date for context.'),
});

export type NewsSummaryInput = z.infer<typeof NewsSummaryInputSchema>;

const NewsSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise, engaging daily summary of tech and community news.'),
  highlights: z.array(z.string()).describe('Top 3-5 key takeaways for the day.'),
  stateOfTheCommunity: z.string().describe('A specific section highlighting w3Develops community activity and growth.'),
});

export type NewsSummaryOutput = z.infer<typeof NewsSummaryOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateDailyNewsSummaryPrompt',
  input: { schema: NewsSummaryInputSchema },
  output: { schema: NewsSummaryOutputSchema },
  config: {
    model: 'googleai/gemini-1.5-flash',
  },
  prompt: `You are the lead community editor at w3Develops, a global community for developers who learn and build together for free.
Today is {{{today}}}.

Your task is to analyze the following articles and provide a "State of the Community" daily briefing. 

CORE MISSION: Highlight how these tech trends impact learners and builders. Specifically look for developments that align with w3Develops' focus on free coding bootcamps, collaborative projects, and peer-to-peer growth.

Articles for Today:
{{#each articles}}
- {{{title}}} (Source: {{{source}}})
{{/each}}

Format your response to be highly encouraging and developer-focused. Include a special "State of the Community" section that synthesizes the news into actionable inspiration for our members.`,
});

export async function generateDailyNewsSummary(input: NewsSummaryInput): Promise<NewsSummaryOutput> {
  try {
    if (!process.env.GOOGLE_GENAI_API_KEY) {
      throw new Error('GOOGLE_GENAI_API_KEY is not configured.');
    }

    const { output } = await prompt(input);

    if (!output) {
      throw new Error('AI failed to generate a summary.');
    }

    return output;
  } catch (error: any) {
    console.error('AI Summary Error:', error);
    throw new Error(error.message || 'Failed to generate AI summary.');
  }
}
