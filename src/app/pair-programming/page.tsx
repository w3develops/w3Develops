import MatchingProgram from '@/components/MatchingProgram';
import { PAIR_PROGRAMMING } from '@/lib/matching-programs';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-pages';

export const metadata: Metadata = pageMetadata('/pair-programming');

export default function PairProgrammingPage() {
    return <MatchingProgram config={PAIR_PROGRAMMING} />;
}
