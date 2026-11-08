'use client';

import { useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { reportError } from '@/lib/report-error';

/** Shown when a page fails to render; the error is logged for fixing */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError('render', error, error.digest ? { digest: error.digest } : undefined);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4 md:p-10">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <TriangleAlert className="h-12 w-12 text-primary" />
          </div>
          <CardTitle as="h1" className="font-headline text-3xl mt-4">Something went wrong</CardTitle>
          <CardDescription>
            This page hit an error. It has been logged so we can fix it. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          {/* A full page load, so a broken app state doesn't follow the member home */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <Button variant="outline" asChild><a href="/">Go to the homepage</a></Button>
        </CardContent>
      </Card>
    </div>
  );
}
