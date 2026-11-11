// The free services directory on /marketplace: members list services they
// offer and people contact them directly. w3Develops takes no cut and
// handles no payments. firestore.rules (match /serviceListings) checks the
// same limits; keep the two in step.

export const SERVICE_CATEGORIES = {
  websites: 'Websites and web apps',
  mobile: 'Mobile apps',
  design: 'Design and UI/UX',
  marketing: 'Digital marketing and SEO',
  writing: 'Writing and docs',
  data: 'Data and AI',
  devops: 'DevOps and cloud',
  tutoring: 'Tutoring and code review',
  tasks: 'Small tasks and fixes',
  other: 'Other',
} as const;
export type ServiceCategory = keyof typeof SERVICE_CATEGORIES;

/** Each member can list this many services; listing IDs are "<uid>_1" to "<uid>_5" */
export const MAX_LISTINGS_PER_MEMBER = 5;
export const MAX_SERVICE_TITLE = 80;
export const MAX_SERVICE_DESCRIPTION = 1000;
export const MAX_SERVICE_PRICE = 60;
export const MAX_SERVICE_SKILLS = 8;
