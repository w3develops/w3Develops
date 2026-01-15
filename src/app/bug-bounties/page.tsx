
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ExternalLink, ArrowLeft } from 'lucide-react';

const bountyPlatforms = [
    {
        name: "Bugcrowd",
        url: "https://www.bugcrowd.com/",
        description: "A leading crowdsourced cybersecurity platform that connects organizations with a global network of security researchers."
    },
    {
        name: "HackerOne",
        url: "https://hackerone.com/",
        description: "A vulnerability coordination and bug bounty platform that connects businesses with penetration testers and cybersecurity researchers."
    },
    {
        name: "Zero Day Initiative",
        url: "https://www.zerodayinitiative.com/",
        description: "An international software vulnerability initiative that rewards security researchers for responsibly disclosing vulnerabilities."
    }
];

export default function BugBountiesPage() {
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                     <Button asChild variant="outline" size="sm" className="w-fit mb-4">
                        <Link href="/competitions" className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back to Competitions
                        </Link>
                    </Button>
                    <CardTitle className="font-headline text-3xl">Bug Bounty Platforms</CardTitle>
                    <CardDescription>
                        Explore platforms where you can get rewarded for finding and reporting security vulnerabilities.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {bountyPlatforms.map((platform) => (
                        <div key={platform.name} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg">
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold">{platform.name}</h3>
                                <p className="text-muted-foreground mt-1">{platform.description}</p>
                            </div>
                            <Button asChild>
                                <a href={platform.url} target="_blank" rel="noopener noreferrer">
                                    Visit Site <ExternalLink className="h-4 w-4 ml-2" />
                                </a>
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
