
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4 md:p-10">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
           <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
             <TriangleAlert className="h-12 w-12 text-primary" />
           </div>
          <CardTitle className="font-headline text-3xl mt-4">404 - Page Not Found</CardTitle>
          <CardDescription>
            Sorry, the page you are looking for does not exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">Return to Homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
