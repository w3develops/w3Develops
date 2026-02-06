'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ExternalLink, Factory } from 'lucide-react';

const hackerspacePlatforms = [
    {
        name: "Hackerspaces.org",
        url: "https://wiki.hackerspaces.org/List_of_Hacker_Spaces",
        description: "The most comprehensive, community-edited directory of hackerspaces around the globe. A great place to start your search."
    },
    {
        name: "Meetup.com",
        url: "https://www.meetup.com/topics/makerspace/",
        description: "Find local 'maker' and 'hacker' groups. Many hackerspaces organize their events and community through Meetup."
    },
    {
        name: "Instructables - Find a Hackerspace",
        url: "https://www.instructables.com/community/hackerspaces/",
        description: "A directory of hackerspaces, makerspaces, and techshops provided by the popular DIY project community, Instructables."
    }
];

export default function HackerspacesPage() {
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Factory className="h-8 w-8 text-primary" />
                        <CardTitle className="font-headline text-3xl">Hackerspaces & Makerspaces</CardTitle>
                    </div>
                    <CardDescription>
                        Explore platforms to find local communities for building, making, and learning.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {hackerspacePlatforms.map((platform) => (
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
