import type { Metadata } from 'next';
import UserProfilePage from './client';
import JsonLd from '@/components/JsonLd';
import { notFound } from 'next/navigation';
import { getPublicProfile, getPublicProfileOrMissing, itemMetadata, profileHasContent } from '@/lib/public-items';
import { SITE_URL } from '@/lib/site-pages';

type Props = { params: Promise<{ userId: string }> };

// Rendered on the server with the member's public profile, then kept live in the browser
export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type PublicProfile = {
  username?: string;
  bio?: string;
  skills?: string[];
  profilePictureUrl?: string;
  socialLinks?: Record<string, string | undefined>;
};

function profileDescription(profile: PublicProfile, name: string): string {
  if (profile.bio?.trim()) return profile.bio;
  const skills = profile.skills?.slice(0, 8).join(', ');
  return skills
    ? `${name} is a member of w3Develops, the free developer community. Skills: ${skills}.`
    : `${name} is a member of w3Develops, the free developer community.`;
}

const absoluteUrl = (url: string) => (/^https?:\/\//.test(url) ? url : `https://${url}`);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const profile = await getPublicProfile(userId) as PublicProfile | null;
  const name = profile?.username;
  const metadata = itemMetadata(profile && name ? { description: profileDescription(profile, name) } : null, {
    path: `/users/${userId}`,
    name,
    fallbackDescription: '',
    kindLabel: 'Member',
  });
  // Empty profiles can be visited but stay out of search results
  if (profile && name && !profileHasContent(profile)) metadata.robots = { index: false };
  return metadata;
}

export default async function Page({ params }: Props) {
  const { userId } = await params;
  const { profile, missing } = await getPublicProfileOrMissing(userId);
  // A real 404 for members who don't exist, so search engines drop them
  if (missing) notFound();
  const publicProfile = profile as PublicProfile | null;
  const name = publicProfile?.username;
  // Discord is a username, not a link, so it isn't one of the profile's other pages
  const { discord: _discord, ...linkedPages } = publicProfile?.socialLinks ?? {};
  const socialLinks = Object.values(linkedPages).filter((link): link is string => Boolean(link));
  return (
    <>
      {publicProfile && name && profileHasContent(publicProfile) && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          url: `${SITE_URL}/users/${userId}`,
          mainEntity: {
            '@type': 'Person',
            name,
            url: `${SITE_URL}/users/${userId}`,
            description: profileDescription(publicProfile, name),
            ...(publicProfile.profilePictureUrl?.startsWith('https://') && { image: publicProfile.profilePictureUrl }),
            ...(publicProfile.skills?.length && { knowsAbout: publicProfile.skills }),
            ...(socialLinks.length && { sameAs: socialLinks.map(absoluteUrl) }),
            memberOf: { '@type': 'Organization', name: 'w3Develops', url: SITE_URL },
          },
        }} />
      )}
      <UserProfilePage userId={userId} initialProfile={profile} />
    </>
  );
}
