import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';

export const metadata: Metadata = pageMetadata('/time-converter');

export default function TimeConverterLayout({ children }: { children: React.ReactNode }) {
    return children;
}
