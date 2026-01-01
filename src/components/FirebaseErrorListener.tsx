
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

export function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: any) => {
      // Throwing the error here will cause it to be caught by Next.js's
      // development error overlay, making it highly visible.
      // We specifically do not catch this error.
      throw error;
    };

    errorEmitter.on('permission-error', handlePermissionError);

  }, []);

  // This component does not render anything to the DOM.
  return null;
}
