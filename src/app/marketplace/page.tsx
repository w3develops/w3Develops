
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MarketplacePage() {
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Marketplace</CardTitle>
                    <CardDescription>
                        Community-driven marketplace for services and products.
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
