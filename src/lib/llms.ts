import { FAQ_SECTIONS } from '@/lib/faq';
import { HOME_DESCRIPTION, SITE_PAGES, SITE_SECTIONS, SITE_URL, type SitePage } from '@/lib/site-pages';

// Markdown guides for AI tools and agents, following https://llmstxt.org:
// /llms.txt is a short map of the site, and /llms-full.txt adds the text an
// assistant needs to describe w3Develops and answer questions about it.

const SUMMARY =
  'w3Develops is a free, global developer community. Members learn and build together in remote coding study groups and team projects, find mentors, tutors and pair programming partners, take part in competitions and meetups, and follow tech news, all at no cost.';

const DETAILS = [
  `Joining is free at ${SITE_URL}/signup. w3Develops is run by volunteers and supported by donations; there are no ads, and member data is never sold.`,
  'Most activity happens in groups: study groups for learning a topic together, group projects for building a real application as a team, and book clubs for reading together. Members post regular check-ins on their progress to stay accountable.',
];

const ABOUT = [
  'w3Develops is a global community dedicated to helping people grow as developers through collaboration, mentorship and real-world projects. It gives aspiring developers a structured path to practical experience and a professional portfolio.',
  'It works as a free alternative to a coding bootcamp. Members gain experience that mirrors a professional software team: Git and GitHub workflows, agile practices like sprints and stand-ups, and shipping working applications they can show employers. Learning is self-paced and supported by the community.',
  'Because members live in every time zone, study groups and projects meet remotely. Event times are stored in UTC and shown in each member\'s own time zone when they set one in their profile.',
];

const pageUrl = (path: string) => `${SITE_URL}${path}`;

const pagesBySection = () =>
  SITE_SECTIONS.map(section => ({
    section,
    pages: Object.entries(SITE_PAGES as Record<string, SitePage>).filter(([, page]) => page.section === section),
  }));

/** The FAQ's HTML answers as Markdown, with site links made absolute */
function answerToMarkdown(html: string): string {
  return html
    .replace(/<a href='([^']+)'[^>]*>(.*?)<\/a>/g, (_, href: string, text: string) =>
      `[${text}](${href.startsWith('/') ? pageUrl(href) : href})`)
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<[^>]+>/g, '');
}

export function buildLlmsTxt(): string {
  const lines = [
    '# w3Develops',
    '',
    `> ${SUMMARY}`,
    '',
    ...DETAILS.flatMap(paragraph => [paragraph, '']),
    `The full text of the main pages, including the FAQ, is at ${pageUrl('/llms-full.txt')}.`,
    '',
    `- [Home](${pageUrl('/')}): ${HOME_DESCRIPTION}`,
    `- [Join for free](${pageUrl('/signup')}): Create a free account.`,
  ];
  for (const { section, pages } of pagesBySection()) {
    lines.push('', `## ${section}`, '');
    for (const [path, page] of pages) {
      lines.push(`- [${page.title}](${pageUrl(path)}): ${page.description}`);
    }
  }
  return lines.join('\n') + '\n';
}

export function buildLlmsFullTxt(): string {
  const lines = [
    '# w3Develops',
    '',
    `> ${SUMMARY}`,
    '',
    `Website: ${SITE_URL}`,
    '',
    '## About w3Develops',
    '',
    ...[...ABOUT, ...DETAILS].flatMap(paragraph => [paragraph, '']),
    '## What you can do on w3Develops',
  ];
  for (const { section, pages } of pagesBySection()) {
    lines.push('', `### ${section}`, '');
    for (const [path, page] of pages) {
      lines.push(`- **${page.title}** (${pageUrl(path)}): ${page.description}`);
    }
  }
  lines.push('', '## Frequently asked questions');
  for (const faqSection of FAQ_SECTIONS) {
    lines.push('', `### ${faqSection.title}`);
    for (const item of faqSection.items) {
      lines.push('', `#### ${item.question}`, '', answerToMarkdown(item.answer));
    }
  }
  return lines.join('\n') + '\n';
}
