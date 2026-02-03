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
    '/groupprojects',
    '/groupprojects/create',
    '/competitions',
    '/cookies',
    '/contribute',
    '/contribute/security',
    '/contribute/security/hall-of-fame',
    '/donate',
    '/explore',
    '/faq',
    '/feedback',
    '/studygroups',
    '/studygroups/create',
    '/hackathons',
    '/hackerspaces',
    '/job-board',
    '/learn',
    '/login',
    '/mentorship',
    '/meetups',
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
    '/support',
    '/terms',
    '/tutor',
    '/hackathon',
    '/marketplace',
    '/warrant-canary',
    '/tutorships'
  ];

  return staticRoutes.map((route) => ({
    url: `${URL}${route}`,
    lastModified: new Date(),
  }));
}
