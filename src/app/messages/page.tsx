import type { Metadata } from 'next';
import { Suspense } from 'react';
import { pageMetadata } from '@/lib/site-pages';
import Messages from './Messages';

export const metadata: Metadata = pageMetadata('/messages');

export default function MessagesPage() {
  return <Suspense><Messages /></Suspense>;
}
