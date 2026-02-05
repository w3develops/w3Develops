'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ExternalLink, Hammer } from 'lucide-react';

const hackathonPlatforms = [
    {
        name: "Devpost",
        url: "https://devpost.com/",
        description: "A popular platform for discovering and participating in online and in-person hackathons."
    },
    {
        name: "Major League Hacking (MLH)",
        url: "https://mlh.io/",
        description: "The official student hackathon league. Find student-focused hackathons, workshops, and other events."
    },
    {
        name: "HackerEarth",
        url: "https://www.hackerearth.com/challenges/hackathon/",
        description: "Host and participate in hackathons and coding challenges to solve real-world problems."
    },
    {
        name: "Dev.to",
        url: "https://dev.to/t/hackathon",
        description: "A community-driven platform where organizations and communities host hackathons for developers."
    },
    {
        name: "AngelHack",
        url: "https://angelhack.com/",
        description: "A global hackathon series that connects developers with new technologies and innovation."
    }
];

export default function HackathonsPage() {
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Hammer className="h-8 w-8 text-primary" />
                        <CardTitle className="font-headline text-3xl">Hackathon Platforms</CardTitle>
                    </div>
                    <CardDescription>
                        Explore platforms where you can find, join, and compete in hackathons.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {hackathonPlatforms.map((platform) => (
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
