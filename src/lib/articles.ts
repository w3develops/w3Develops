// Member articles on /news: members apply to write, moderators approve them
// as writers, and writers submit articles that moderators publish.
// firestore.rules (isValidArticle, isValidWriterApplication) checks the same
// limits; keep the two in step.

export const ARTICLE_TOPICS = {
  programming: 'Programming',
  career: 'Careers',
  ai: 'AI',
  security: 'Security',
  'open-source': 'Open source',
  community: 'Community',
  other: 'Other',
} as const;
export type ArticleTopic = keyof typeof ARTICLE_TOPICS;

export const ARTICLE_STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Waiting for review',
  published: 'Published',
  rejected: 'Sent back',
} as const;

export const MIN_TITLE = 10;
export const MAX_TITLE = 120;
export const MAX_SUMMARY = 300;
export const MAX_BODY = 20000;
export const MAX_ABOUT = 1000;
export const MAX_SAMPLE_LINKS = 3;
