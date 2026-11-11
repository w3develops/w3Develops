import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';
import { getPublicList } from '@/lib/public-items';
import ServiceDirectory from './ServiceDirectory';

// Rendered with the current listings at most every five minutes
export const revalidate = 300;

export const metadata: Metadata = pageMetadata('/marketplace');

export default async function MarketplacePage() {
  const initial = await getPublicList({ collection: 'serviceListings', orderBy: 'updatedAt', direction: 'desc', limit: 200 });
  return <ServiceDirectory initial={initial} />;
}
