'use client';

import { NewsletterSubscription } from '@/components/newsletter/Newsletter';
import { useUser } from '@/firebase';

export default function NewsletterPreference() {
  const { user } = useUser();
  return user ? <NewsletterSubscription user={user} region="us-central1" /> : null;
}
