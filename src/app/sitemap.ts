
import { MetadataRoute } from 'next';

const URL = 'https://w3develops.org';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/account',
    '/account/my-tasks',
    '/account/notifications',
    '/book-clubs',
    '/book-clubs/create',
    '/bug-bounties',
    '/chat',
    '/competitions',
    '/competitions/create',
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
    '/hackathons',
    '/hackerspaces',
    '/job-board',
    '/job-board/create',
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
    '/warrant-canary',
  ];

  return staticRoutes.map((route) => ({
    url: `${URL}${route}`,
    lastModified: new Date(),
  }));
}
