import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';
import WriterDesk from './WriterDesk';

export const metadata: Metadata = pageMetadata('/news/write');

export default function WriteForNewsPage() {
  return <WriterDesk />;
}
