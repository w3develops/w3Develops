import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site-pages';

// The page itself runs in the browser, so its title and description are set
// here. No preferred address, since the pages under this folder inherit it.
export const metadata: Metadata = pageMetadata('/meetups', { canonical: false, layout: true });

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
