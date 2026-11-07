import MatchingProgram from '@/components/MatchingProgram';
import { TUTORING } from '@/lib/matching-programs';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';

export const metadata: Metadata = pageMetadata('/tutor');

export default function TutorPage() {
    return <MatchingProgram config={TUTORING} />;
}
