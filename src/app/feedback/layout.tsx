import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site-pages';

// The page itself runs in the browser, so its title and description are set here
export const metadata: Metadata = pageMetadata('/feedback');

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
