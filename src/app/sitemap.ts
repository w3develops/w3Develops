
import { MetadataRoute } from 'next';

const URL = 'https://w3develops.org';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/account',
    '/account/notifications',
    '/book-clubs',
    '/book-clubs/create',
    '/bug-bounties',
    '/chat',
    '/competitions',
    '/cookies',
    '/contribute',
    '/contribute/security',
    '/contribute/security/hall-of-fame',
    '/donate',
    '/explore',
    '/faq',
    '/feedback',
    '/groupprojects',
    '/groupprojects/create',
    '/hackathon',
    '/hackathons',
    '/hackerspaces',
    '/job-board',
    '/learn',
    '/login',
    '/marketplace',
    '/mentorship',
    '/meetups',
    '/meetups/create',
    '/news',
    '/news/archive',
    '/newsletter',
    '/notifications',
    '/pair-programming',
    '/pairings',
    '/podcast',
    '/privacy',
    '/profile/edit',
    '/search',
    '/security',
    '/settings',
    '/signup',
    '/solo-projects',
    '/studygroups',
    '/studygroups/create',
    '/support',
    '/terms',
    '/tutor',
    '/tutorships',
    '/warrant-canary',
  ];

  return staticRoutes.map((route) => ({
    url: `${URL}${route}`,
    lastModified: new Date(),
  }));
}
