import MatchingProgram from '@/components/MatchingProgram';
import { MENTORSHIP } from '@/lib/matching-programs';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';

export const metadata: Metadata = pageMetadata('/mentorship');

export default function MentorshipPage() {
    return <MatchingProgram config={MENTORSHIP} />;
}
