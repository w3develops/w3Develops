import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';
import ModerationQueue from './ModerationQueue';

export const metadata: Metadata = pageMetadata('/moderation');

export default function ModerationPage() {
  return <ModerationQueue />;
}
