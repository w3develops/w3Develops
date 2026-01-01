import { MetadataRoute } from 'next';

const URL = 'https://w3develops.org';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/account',
    '/book-clubs',
    '/chat',
    '/groupprojects',
    '/groupprojects/create',
    '/competitions',
    '/cookies',
    '/contribute',
    '/contribute/security',
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
    '/marketplace'
  ];

  return staticRoutes.map((route) => ({
    url: `${URL}${route}`,
    lastModified: new Date(),
  }));
}
