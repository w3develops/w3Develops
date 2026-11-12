import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicItem, getPublicItemOrMissing, itemMetadata } from '@/lib/public-items';
import OrgPage from './OrgPage';

export const revalidate = 300;

type Props = { params: Promise<{ orgId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orgId } = await params;
  const org = await getPublicItem('organizations', orgId);
  return itemMetadata(org && { ...org, description: org.about || org.tagline }, {
    path: `/orgs/${orgId}`, name: typeof org?.name === 'string' ? org.name : undefined,
    fallbackDescription: 'An organization on w3Develops.', kindLabel: 'Organization',
  });
}

export default async function OrganizationPage({ params }: Props) {
  const { orgId } = await params;
  const { item, missing } = await getPublicItemOrMissing('organizations', orgId);
  // A real 404 for pages that don't exist, so search engines drop them
  if (missing) notFound();
  return <OrgPage orgId={orgId} initial={item} />;
}
