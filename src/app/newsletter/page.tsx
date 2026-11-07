'use client';

import { useTransition, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from '@/firebase';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NewsletterSubscription from '@/components/NewsletterSubscription';

export default function NewsletterPage() {
    const { user, isUserLoading } = useUser();
    const pathname = usePathname();
    
    return (
        <div className="max-w-2xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <CardTitle as="h1" className="font-headline text-3xl">w3Develops Newsletter</CardTitle>
                    <CardDescription>
                        Get the latest news, articles, and resources from the w3Develops community, sent straight to your inbox.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    {isUserLoading ? (
                        <div className="h-24 animate-pulse rounded-md bg-muted" />
                    ) : user ? (
                        <div className="space-y-4">
                           <NewsletterSubscription />
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <p className="text-muted-foreground">
                                Please <Link href={`/login?redirect=${encodeURIComponent(pathname)}`} className="underline font-semibold hover:text-primary">sign in</Link> to manage your newsletter subscription.
                            </p>
                             <Button asChild>
                                <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>Login</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
