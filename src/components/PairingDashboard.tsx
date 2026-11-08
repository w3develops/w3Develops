'use client';

import type { ComponentProps } from 'react';
import { MatchingDashboard } from '@/components/MatchingProgram';
import { PAIR_PROGRAMMING } from '@/lib/matching-programs';

/** Pair programming requests and partners, for the account page. */
export default function PairingDashboard(props: Omit<ComponentProps<typeof MatchingDashboard>, 'config'>) {
  return <MatchingDashboard config={PAIR_PROGRAMMING} {...props} />;
}
