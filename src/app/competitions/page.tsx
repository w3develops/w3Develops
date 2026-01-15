
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowRight, Bug } from "lucide-react";

export default function CompetitionsPage() {
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Competitions</CardTitle>
                    <CardDescription>
                        Test your skills in our community coding competitions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <h3 className="text-xl font-semibold">Under Construction</h3>
                        <p className="text-muted-foreground mt-2">
                            The competitions page is coming soon. Stay tuned!
                        </p>
                    </div>

                    <div className="mt-8 border-t pt-8">
                        <Card className="bg-secondary/50">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Bug className="h-8 w-8 text-primary" />
                                    <CardTitle>Looking for Bug Bounties?</CardTitle>
                                </div>
                                <CardDescription>
                                    Explore external platforms where you can get rewarded for finding security vulnerabilities in real-world applications.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild>
                                    <Link href="/bug-bounties">
                                        Explore Bug Bounties <ArrowRight className="h-4 w-4 ml-2" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
