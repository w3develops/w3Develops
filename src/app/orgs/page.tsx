import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';
import { getPublicList } from '@/lib/public-items';
import OrgDirectory from './OrgDirectory';

export const revalidate = 300;

export const metadata: Metadata = pageMetadata('/orgs');

export default async function OrganizationsPage() {
  return <OrgDirectory initial={await getPublicList({ collection: 'organizations', orderBy: 'createdAt', direction: 'desc', limit: 200 })} />;
}
