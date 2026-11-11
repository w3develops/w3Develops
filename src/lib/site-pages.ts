import type { Metadata } from 'next';

// The site's main public pages, with the title and description search
// engines and AI tools see. Page metadata and /llms.txt are both built from
// this list, so a page's summary only lives in one place.

export const SITE_URL = 'https://w3develops.org';
export const SITE_NAME = 'w3Develops';

export const HOME_TITLE = 'w3Develops: Free Remote Coding Study Groups, Projects & Mentorship';
export const HOME_DESCRIPTION =
  'A free, global developer community. Join remote coding study groups and team projects, find a mentor or pair programming partner, and build a real portfolio.';

// Shown when a page is shared on Discord, LinkedIn, X and similar
export const SHARE_IMAGE = { url: '/newheader.jpg', width: 1900, height: 1250, alt: 'w3Develops community' };

/** Link-preview details; a page's own Open Graph replaces the layout's, so each page needs all of them */
export function sharePreview(title: string, description: string, path: string): Pick<Metadata, 'openGraph' | 'twitter'> {
  return {
    openGraph: { type: 'website', siteName: SITE_NAME, title, description, url: path, images: [SHARE_IMAGE] },
    twitter: { card: 'summary_large_image', site: '@w3develops', title, description, images: [SHARE_IMAGE.url] },
  };
}

export interface SitePage {
  title: string;
  description: string;
  /** Heading the page is listed under in /llms.txt; left out of it when absent */
  section?: SiteSection;
  /** Members-only or unfinished: kept out of search results and the sitemap */
  noindex?: boolean;
}

export const SITE_SECTIONS = [
  'Learn and build together',
  'Find people to work with',
  'Events and challenges',
  'News and media',
  'Get involved',
  'About and policies',
] as const;
export type SiteSection = (typeof SITE_SECTIONS)[number];

export const SITE_PAGES = {
  '/explore': {
    title: 'Explore',
    description: 'Every way to learn, build and connect on w3Develops: study groups, group projects, mentorship, meetups, competitions, news and more.',
    section: 'Learn and build together',
  },
  '/studygroups': {
    title: 'Study Groups',
    description: 'Join a free remote coding study group to learn a language, framework or topic with developers worldwide, with regular check-ins to keep you on track.',
    section: 'Learn and build together',
  },
  '/groupprojects': {
    title: 'Group Projects',
    description: 'Build a real application with a remote team. Free collaborative coding projects that give you Git, teamwork and portfolio experience.',
    section: 'Learn and build together',
  },
  '/algorithms-daily': {
    title: 'Algorithms Daily',
    description: 'A new classic coding interview problem every day, with an example and hints. Practice algorithms and data structures with the w3Develops community.',
    section: 'Learn and build together',
  },
  '/project-ideas': {
    title: 'Project Ideas',
    description: 'Coding project ideas for beginners to advanced developers, by track: frontend, backend, full stack, DevOps, data and mobile. Build one solo or with a team.',
    section: 'Learn and build together',
  },
  '/book-clubs': {
    title: 'Book Clubs',
    description: 'Read programming and tech books together with other developers, talk through each chapter and keep each other going.',
    section: 'Learn and build together',
  },
  '/solo-projects': {
    title: 'Solo Projects',
    description: 'A community gallery of members\' own apps and repos. Submit your solo project to showcase your work and get it seen.',
    section: 'Learn and build together',
  },
  '/learn': {
    title: 'Learn to Code',
    description: 'Curated resources for programming fundamentals, web development from frontend to backend, and digital marketing.',
    section: 'Learn and build together',
  },
  '/feed': {
    title: 'Community Feed',
    description: 'Short public posts from w3Develops members about what they are learning and building, with posts from people and topics you follow first.',
    section: 'Find people to work with',
  },
  '/moderation': {
    title: 'Moderation',
    description: 'Review reported posts and keep the community feed safe. For w3Develops moderators only.',
    noindex: true,
  },
  '/mentorship': {
    title: 'Mentorship',
    description: 'Find a developer mentor, or mentor newcomers, for free. Connect by skill, then work together in a private shared dashboard.',
    section: 'Find people to work with',
  },
  '/tutor': {
    title: 'Tutoring',
    description: 'Find a free coding tutor, or tutor other learners. Connect by skill, then work together in a private shared dashboard.',
    section: 'Find people to work with',
  },
  '/pair-programming': {
    title: 'Pair Programming',
    description: 'Find a pair programming partner by skill and write code together in real time with a shared editor.',
    section: 'Find people to work with',
  },
  '/meetups': {
    title: 'Meetups',
    description: 'Find and host local and online developer meetups to connect with the w3Develops community.',
    section: 'Find people to work with',
  },
  '/chat': {
    title: 'Discord Community',
    description: 'Join the conversation with w3Develops members on our official Discord server.',
    noindex: true,
  },
  '/events': {
    title: 'Events',
    description: 'Upcoming w3Develops meetups and coding competitions in one calendar, in your time zone, with one-click add to your own calendar.',
    section: 'Events and challenges',
  },
  '/competitions': {
    title: 'Coding Competitions',
    description: 'Test your skills in w3Develops community coding challenges. See active and upcoming competitions and submit your entry.',
    section: 'Events and challenges',
  },
  '/time-converter': {
    title: 'Time Zone Converter',
    description: 'Find your offset from UTC and convert meeting times between time zones, so you can join study groups and events from anywhere.',
    section: 'Events and challenges',
  },
  '/hackathons': {
    title: 'Hackathons',
    description: 'Platforms where you can find, join and compete in online and in-person hackathons, including Major League Hacking.',
    section: 'Events and challenges',
  },
  '/hackerspaces': {
    title: 'Hackerspaces & Makerspaces',
    description: 'Directories to help you find a hackerspace or makerspace near you, where you can build things, learn and meet makers.',
    section: 'Events and challenges',
  },
  '/bug-bounties': {
    title: 'Bug Bounty Platforms',
    description: 'Bug bounty platforms where security researchers find and responsibly disclose vulnerabilities for rewards.',
    section: 'Events and challenges',
  },
  '/news': {
    title: 'Tech News',
    description: 'The latest tech headlines from dozens of sources, daily w3Develops community insights and topic roundups, an AI community briefing refreshed eight times a day, and announcements.',
    section: 'News and media',
  },
  '/news/ai-community-brief': {
    title: 'AI Community Briefing',
    description: 'A short briefing on the tech headlines that matter to developers, sorted by topic and ranked by importance, refreshed eight times a day.',
    section: 'News and media',
  },
  '/news/developer-news-style-guide': {
    title: 'Developer News Style Guide',
    description: 'How to write for w3Develops: a plain, friendly voice, tested code samples, linked sources, accessible images and honest use of AI.',
    section: 'Get involved',
  },
  '/news/archive': {
    title: 'News Archive',
    description: 'Every w3Develops post: nightly community insights, plus daily roundups on hardware and robotics, software and security, crypto, business, marketing, sales, and open source.',
    section: 'News and media',
  },
  '/podcast': {
    title: 'Podcast',
    description: 'Watch and listen to episodes of the w3Develops podcast.',
    section: 'News and media',
  },
  '/newsletter': {
    title: 'Newsletter',
    description: 'Get the latest news, articles and resources from the w3Develops community sent to your inbox.',
    section: 'News and media',
  },
  '/job-board': {
    title: 'Job Board',
    description: 'Tech job listings shared by the w3Develops community. Find your next opportunity in tech.',
    section: 'Get involved',
  },
  '/careers': {
    title: 'Careers & Internships',
    description: 'Volunteer on the w3Develops core team. Web development and digital marketing internships that give you real-world experience.',
    section: 'Get involved',
  },
  '/contribute': {
    title: 'Contribute',
    description: 'Help build w3Develops, a community made by volunteers. Ways to give your code, design, writing and time.',
    section: 'Get involved',
  },
  '/contribute/guide': {
    title: 'Contributor Guide',
    description: 'A step-by-step guide to contributing to w3Develops, from finding a task to getting your work merged.',
    section: 'Get involved',
  },
  '/marketplace': {
    title: 'Services Directory',
    description: 'Hire w3Develops members for websites, apps, design, marketing and more. Free to list and free to browse; you contact members directly.',
    section: 'Find people to work with',
  },
  '/donate': {
    title: 'Donate',
    description: 'Support w3Develops with a donation to keep learning resources and collaboration free for developers worldwide.',
    section: 'Get involved',
  },
  '/faq': {
    title: 'Frequently Asked Questions',
    description: 'Answers to common questions about w3Develops: what it is, why it\'s free, study groups and group projects, mentorship, check-ins and privacy.',
    section: 'About and policies',
  },
  '/support': {
    title: 'Support',
    description: 'Get help with your w3Develops account or report a technical issue.',
    noindex: true,
  },
  '/feedback': {
    title: 'Feedback',
    description: 'Tell us how we can improve the w3Develops community.',
    noindex: true,
  },
  '/contribute/security': {
    title: 'Security Disclosure Policy',
    description: 'How to test for and responsibly report security vulnerabilities in w3Develops.',
    section: 'About and policies',
  },
  '/contribute/security/hall-of-fame': {
    title: 'Security Hall of Fame',
    description: 'Security researchers who responsibly disclosed vulnerabilities to w3Develops.',
  },
  '/privacy': {
    title: 'Privacy Policy',
    description: 'What w3Develops collects, why, who it is shared with, and how to see, change or delete your information.',
    section: 'About and policies',
  },
  '/terms': {
    title: 'Terms of Use',
    description: 'The ground rules for using w3Develops, written in plain language: be kind, own your work, and help each other learn.',
    section: 'About and policies',
  },
  '/cookies': {
    title: 'Cookies',
    description: 'The few cookies and browser storage w3Develops uses, what each one is for, and how to turn them off.',
    section: 'About and policies',
  },
  '/code-of-conduct': {
    title: 'Code of Conduct',
    description: 'How members treat each other on w3Develops: be kind, no harassment, trolling or spam, and how to report a problem.',
    section: 'About and policies',
  },
  '/warrant-canary': {
    title: 'Warrant Canary',
    description: 'A regularly updated statement that w3Develops has never received a secret legal order.',
    section: 'About and policies',
  },
} satisfies Record<string, SitePage>;

export type SitePath = keyof typeof SITE_PAGES;

/**
 * The title, description and preferred address for one of the pages above.
 * From a layout whose folder has other pages under it (like
 * /meetups/[meetupId]), pass `layout: true`, and `canonical: false` unless
 * every page under it sets its own address, so they don't look like copies
 * of the list page.
 */
export function pageMetadata(path: SitePath, { canonical = true, layout = false } = {}): Metadata {
  const page: SitePage = SITE_PAGES[path];
  return {
    // A layout that sets its own title must pass the site's "| w3Develops"
    // pattern on itself, or the pages under it lose it (the root layout's
    // pattern still adds it to the layout's own title)
    title: layout ? { default: page.title, template: `%s | ${SITE_NAME}` } : page.title,
    description: page.description,
    ...(canonical && { alternates: { canonical: path } }),
    ...(page.noindex && { robots: { index: false } }),
    ...sharePreview(`${page.title} | ${SITE_NAME}`, page.description, path),
  };
}

/** Public pages that belong in the sitemap */
export const INDEXABLE_PATHS = ['/', ...Object.entries(SITE_PAGES as Record<string, SitePage>)
  .filter(([, page]) => !page.noindex)
  .map(([path]) => path)];
