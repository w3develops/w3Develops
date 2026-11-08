import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site-pages';

// Passes the site's "| w3Develops" title pattern on to the pages under /news
export const metadata: Metadata = pageMetadata('/news', { layout: true });

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
