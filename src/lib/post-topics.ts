// The topics of w3Develops' scheduled posts, one per news refresh time.
//
// The scheduler in functions/src/posts.ts publishes one post per topic per
// day, at the topic's hour (Pacific time, the same hours the news page
// refreshes at in src/lib/news-schedule.ts), so a new post goes up every
// three hours. The functions keep a copy of this file, made by
// functions/scripts/copy-shared.mjs when they build, so it must not import
// anything.

export const POST_TOPIC_IDS = [
  'community', 'hardware', 'software', 'crypto', 'business', 'marketing', 'sales', 'opensource',
] as const;
export type PostTopic = (typeof POST_TOPIC_IDS)[number];

export interface PostTopicInfo {
  id: PostTopic;
  label: string;
  /** Hour (0 to 23, Pacific time) the topic's post goes out */
  hour: number;
  /** One line on what the topic covers */
  blurb: string;
}

export const POST_TOPICS: PostTopicInfo[] = [
  {
    id: 'community', label: 'Community insights', hour: 1,
    blurb: "What's happening on w3Develops: new and starting study groups, projects and book clubs, upcoming meetups and competitions.",
  },
  {
    id: 'hardware', label: 'Hardware and robotics', hour: 4,
    blurb: 'Chips, devices, makers and robots.',
  },
  {
    id: 'software', label: 'Software and cybersecurity', hour: 7,
    blurb: 'Languages, frameworks and tools, plus security news and vulnerabilities.',
  },
  {
    id: 'crypto', label: 'Crypto and blockchain', hour: 10,
    blurb: 'Cryptocurrency, blockchain and Web3 news.',
  },
  {
    id: 'business', label: 'Business', hour: 13,
    blurb: 'Tech business news for developers.',
  },
  {
    id: 'marketing', label: 'Marketing', hour: 16,
    blurb: 'Marketing, SEO and content news and updates.',
  },
  {
    id: 'sales', label: 'Sales', hour: 19,
    blurb: 'Sales news, ideas and updates.',
  },
  {
    id: 'opensource', label: 'Open source and nonprofits', hour: 22,
    blurb: 'Open source projects, foundations and nonprofit news.',
  },
];

export function isPostTopic(value: unknown): value is PostTopic {
  return typeof value === 'string' && (POST_TOPIC_IDS as readonly string[]).includes(value);
}

export function postTopic(id: PostTopic): PostTopicInfo {
  return POST_TOPICS.find(topic => topic.id === id)!;
}
