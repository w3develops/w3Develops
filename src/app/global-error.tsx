'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/report-error';

// Shown only if the site's main layout itself fails, so it can't use the
// site's components or styles
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError('render', error, { ...(error.digest ? { digest: error.digest } : {}), where: 'root layout' });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0, padding: 16, textAlign: 'center' }}>
        <div>
          <h1>Something went wrong</h1>
          <p>w3Develops hit an error. It has been logged so we can fix it.</p>
          <button type="button" onClick={reset} style={{ padding: '8px 16px', cursor: 'pointer' }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
