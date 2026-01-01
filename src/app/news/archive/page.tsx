
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewsArchivePage() {
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <Button asChild variant="outline" size="sm" className="w-fit">
                        <Link href="/news" className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back to News
                        </Link>
                    </Button>
                    <CardTitle className="font-headline text-3xl pt-4">News Archive</CardTitle>
                    <CardDescription>
                        Older news and announcements.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <h3 className="text-xl font-semibold">Under Construction</h3>
                        <p className="text-muted-foreground mt-2">
                            This page is coming soon. Stay tuned!
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
