/**
 * @fileOverview Builds the daily community news brief.
 *
 * TypeSafe's Jev model sorts each headline into a topic and scores how
 * important it is. Jev does not write text, so the summary and community
 * note are filled in from templates below. If Jev is unavailable, headlines
 * are sorted by keyword instead, so the brief always renders.
 *
 * - generateNewsBrief - Builds the brief from a list of posts.
 * - NewsBrief - The brief returned to the page.
 */

import type { Post } from '@/lib/news';

type Topic = 'programming' | 'ai' | 'crypto' | 'tech';

export interface BriefStory {
  title: string;
  link: string;
  source: string;
  topicLabel: string;
  importance: number;
}

export interface NewsBrief {
  date: string;
  summary: string;
  highlights: BriefStory[];
  stateOfTheCommunity: string;
  rankedBy: 'jev' | 'keywords';
  generatedAt: string;
}

const JEV_URL = 'https://api.typesafe.ai/v1/systemone';
const JEV_MODEL = 'jev-latest';
const STORY_LIMIT = 15;
const HIGHLIGHT_COUNT = 3;

const TOPICS: Topic[] = ['programming', 'ai', 'crypto', 'tech'];

const TOPIC_LABELS: Record<Topic, string> = {
  programming: 'Programming',
  ai: 'Artificial Intelligence',
  crypto: 'Crypto & Web3',
  tech: 'General Tech',
};

// Descriptions Jev uses to choose a topic for each headline
const TOPIC_CRITERIA: Record<Topic, string> = {
  programming:
    'Programming languages, frameworks, developer tools or open source',
  ai: 'Artificial intelligence, machine learning, AI models or AI policy',
  crypto: 'Cryptocurrency, blockchain, Web3, crypto markets or regulation',
  tech: 'Other technology news: hardware, big tech, security or science',
};

// Rubric levels for Jev's importance score, lowest to highest
const IMPORTANCE_CRITERIA = [
  'Minor or niche story',
  'Notable story for developers',
  'Major story most developers should know about',
];

// Used only when Jev is unavailable
const TOPIC_KEYWORDS: Record<Exclude<Topic, 'tech'>, string[]> = {
  ai: [
    'ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt',
    'openai', 'anthropic', 'claude', 'gemini', 'chatbot', 'neural',
  ],
  crypto: [
    'crypto', 'bitcoin', 'btc', 'ethereum', 'eth', 'blockchain', 'web3',
    'token', 'defi', 'nft', 'stablecoin', 'solana', 'coinbase', 'binance',
  ],
  programming: [
    'javascript', 'typescript', 'python', 'rust', 'golang', 'java',
    'react', 'node.js', 'framework', 'developer', 'programming',
    'open source', 'github', 'api', 'sdk', 'compiler',
  ],
};

// Keyword-sorted stories rank below any story Jev scored
const DEFAULT_IMPORTANCE = 0;

const COMMUNITY_NOTES: Record<Topic | 'balanced', string> = {
  ai:
    'AI is the biggest story today. If you are learning, pick one of these ' +
    'headlines, try the tool or model yourself, and share what you find ' +
    'with your w3Develops study group.',
  programming:
    'It is a big day for developer tools. New releases are a good excuse ' +
    'to start a small build project together, so grab a teammate and try ' +
    "what's new.",
  crypto:
    'Crypto and Web3 lead the feed. Whatever you think of the market, the ' +
    'tech underneath it (wallets, smart contracts, cryptography) is worth ' +
    'understanding. Compare notes with other members before forming an ' +
    'opinion.',
  tech:
    'Big tech, hardware and security are in the spotlight. Stories like ' +
    'these shape the tools we all use, so they are worth a quick read and ' +
    'a conversation in the community.',
  balanced:
    'Today’s news is spread across every corner of tech. It is a good day ' +
    'to read outside your usual lane and bring one new idea to your study ' +
    'group.',
};

interface Classification {
  topic: Topic;
  importance: number;
}

function isTopic(value: unknown): value is Topic {
  return TOPICS.includes(value as Topic);
}

async function classifyWithJev(
  post: Post,
  apiKey: string
): Promise<Classification> {
  const response = await fetch(JEV_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: JEV_MODEL,
      state: `${post.title} (Source: ${post.source})`,
      questions: {
        topic: {
          type: 'choice',
          instructions: 'Which topic this tech news headline belongs to',
          criteria: TOPIC_CRITERIA,
        },
        importance: {
          type: 'score',
          instructions:
            'How important this headline is for developers who learn ' +
            'and build together',
          criteria: IMPORTANCE_CRITERIA,
        },
      },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Jev request failed with status ${response.status}`);
  }

  const data = await response.json();
  const topic = data?.answers?.topic?.choice;
  const importance = data?.answers?.importance?.score;

  if (!isTopic(topic) || typeof importance !== 'number') {
    throw new Error('Jev returned an unexpected response shape');
  }

  return { topic, importance };
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function classifyByKeywords(post: Post): Classification {
  let bestTopic: Topic = 'tech';
  let bestMatches = 0;

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const matches = keywords.filter(keyword =>
      new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i').test(post.title)
    ).length;

    if (matches > bestMatches) {
      bestTopic = topic as Topic;
      bestMatches = matches;
    }
  }

  return { topic: bestTopic, importance: DEFAULT_IMPORTANCE };
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/**
 * Builds the daily brief from the newest posts. Never throws: any headline
 * Jev cannot classify falls back to keyword sorting.
 */
export async function generateNewsBrief(
  posts: Post[],
  rawApiKey = process.env.JEV_API_KEY
): Promise<NewsBrief> {
  const stories = posts.slice(0, STORY_LIMIT);
  // Remove any accidental quotes or surrounding whitespace from the secret
  const apiKey = rawApiKey?.trim().replace(/['"]/g, '');

  let classifications: Classification[];
  let jevCount = 0;

  if (apiKey) {
    const results = await Promise.allSettled(
      stories.map(post => classifyWithJev(post, apiKey))
    );

    classifications = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        jevCount++;
        return result.value;
      }
      console.warn(
        `Jev could not classify "${stories[index].title}":`,
        result.reason?.message ?? result.reason
      );
      return classifyByKeywords(stories[index]);
    });
  } else {
    console.warn('JEV_API_KEY is not set. Sorting headlines by keyword.');
    classifications = stories.map(classifyByKeywords);
  }

  const classified = stories.map((post, index) => ({
    title: post.title,
    link: post.link,
    source: post.source,
    topic: classifications[index].topic,
    topicLabel: TOPIC_LABELS[classifications[index].topic],
    importance: classifications[index].importance,
  }));

  const topicCounts = Object.fromEntries(
    TOPICS.map(topic => [
      topic,
      classified.filter(story => story.topic === topic).length,
    ])
  ) as Record<Topic, number>;

  const rankedTopics = TOPICS
    .filter(topic => topicCounts[topic] > 0)
    .sort((a, b) => topicCounts[b] - topicCounts[a]);

  // Stable sort: equally important stories stay newest first
  const highlights = [...classified]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, HIGHLIGHT_COUNT)
    .map(({ topic, ...story }) => story);

  let summary = 'No new headlines came in today. Check back soon.';
  let stateOfTheCommunity = 'Nothing new to report yet.';

  if (classified.length > 0) {
    const [lead, second] = rankedTopics;
    const topStory = highlights[0];

    summary =
      `Today's feed has ${plural(classified.length, 'story', 'stories')}. ` +
      `${TOPIC_LABELS[lead]} leads with ${topicCounts[lead]}` +
      (second
        ? `, followed by ${TOPIC_LABELS[second]} with ` +
          `${topicCounts[second]}. `
        : '. ') +
      `The top story is "${topStory.title}" from ${topStory.source}.`;

    const isBalanced = second && topicCounts[lead] === topicCounts[second];
    stateOfTheCommunity = COMMUNITY_NOTES[isBalanced ? 'balanced' : lead];
  }

  return {
    date: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }),
    summary,
    highlights,
    stateOfTheCommunity,
    rankedBy: jevCount > 0 ? 'jev' : 'keywords',
    generatedAt: new Date().toISOString(),
  };
}
