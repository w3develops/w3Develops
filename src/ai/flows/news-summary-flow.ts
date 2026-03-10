'use server';
/**
 * @fileOverview A flow to generate a daily AI tech news summary using the Google Generative AI SDK.
 *
 * - generateDailyNewsSummary - A function that handles the AI news synthesis process.
 * - NewsSummaryInput - The input type for the summary flow.
 * - NewsSummaryOutput - The return type for the summary flow.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from 'zod';

const NewsSummaryInputSchema = z.object({
  articles: z.array(z.object({
    title: z.string(),
    link: z.string(),
    source: z.string(),
  })),
  today: z.string(),
});

export type NewsSummaryInput = z.infer<typeof NewsSummaryInputSchema>;

const NewsSummaryOutputSchema = z.object({
  summary: z.string(),
  highlights: z.array(z.string()),
  stateOfTheCommunity: z.string(),
});

export type NewsSummaryOutput = z.infer<typeof NewsSummaryOutputSchema>;

/**
 * Generates a daily news summary using Gemini 2.0 Flash.
 * Includes character cleaning for the API key and detailed diagnostic logging for Logs Explorer.
 */
export async function generateDailyNewsSummary(input: NewsSummaryInput): Promise<NewsSummaryOutput> {
  const rawApiKey = process.env.GEMINI_API_KEY;

  try {
    if (!rawApiKey) {
      console.error("CRITICAL: GEMINI_API_KEY is missing from environment variables.");
      throw new Error("API key not configured.");
    }

    // Clean the API key: remove any accidental quotes or surrounding whitespace
    const apiKey = rawApiKey.trim().replace(/['"]/g, '');
    
    // Diagnostic logging for Logs Explorer troubleshooting
    console.log(`DIAGNOSTIC: Processing request for ${input.today}. API Key detected. Length: ${apiKey.length}. Starts with: ${apiKey.substring(0, 3)}... Ends with: ${apiKey.substring(apiKey.length - 3)}`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `You are the lead tech editor at w3Develops. Today is ${input.today}.
Your task is to analyze the following articles and provide a synthesized "Tech World Briefing" in JSON format.

CORE MISSION: Focus on these four pillars:
1. Programming Updates (Frameworks, tools, languages).
2. Artificial Intelligence (Models, ethics, breakthroughs).
3. Cryptocurrency & Web3 (Market, blockchain, regulation).
4. General Tech Updates (Hardware, big tech news).

Articles for Today:
${input.articles.slice(0, 15).map(a => `- ${a.title} (Source: ${a.source})`).join('\n')}

Return a JSON object with these exact keys:
{
  "summary": "A concise, engaging briefing paragraph",
  "highlights": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3"],
  "stateOfTheCommunity": "Explain why this matters to developers learning together"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error("Gemini returned an empty response.");
    }

    const parsedData = JSON.parse(responseText);
    return NewsSummaryOutputSchema.parse(parsedData);

  } catch (error: any) {
    const errorDetails = {
      message: error.message,
      status: error.status || 'Unknown Status',
      reason: error.reason || 'Unknown Reason',
      timestamp: new Date().toISOString(),
    };

    console.error("AI GENERATION FAILED:", JSON.stringify(errorDetails, null, 2));

    if (error.message?.toLowerCase().includes('api key not valid') || error.message?.includes('400')) {
      throw new Error('AI service authentication failed. The GEMINI_API_KEY was rejected by Google. Common fixes: 1. Ensure the "Generative Language API" is enabled in Google Cloud Console. 2. Remove any quotes or spaces from your secret value.');
    }

    throw new Error('The AI was unable to synthesize the news. Check Logs Explorer for "AI GENERATION FAILED" to see the technical error details.');
  }
}
