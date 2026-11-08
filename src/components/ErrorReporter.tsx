'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/report-error';

/** Reports errors no other code caught, from anywhere on the page */
export default function ErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => reportError('uncaught', event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) => reportError('unhandled-rejection', event.reason);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}
