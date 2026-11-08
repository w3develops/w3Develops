'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';
import { reportError } from '@/lib/report-error';

// Makes denied Firestore requests easy to spot. In development the error is
// rethrown on its own so it shows in the Next.js overlay; in production it's
// sent to the server log with the path and operation (never the data). Either
// way the code that reported it carries on and can still show the member a
// friendly message.
export function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => { throw error; });
      } else {
        console.error(error);
        reportError('permission-denied', new Error(`${error.context.operation} ${error.context.path}`), {
          operation: error.context.operation,
          path: error.context.path,
        });
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => errorEmitter.off('permission-error', handlePermissionError);
  }, []);

  // This component does not render anything to the DOM.
  return null;
}
