import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      // The app pulls from .env.local locally and Secret Manager in production.
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});
