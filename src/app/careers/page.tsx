
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Briefcase, Code, Megaphone, Users, Sparkles } from 'lucide-react';

const internalJobs = [
    {
        id: "web-development-internship",
        title: "Web Development Internship",
        description: "Join our core engineering team to build and maintain the w3Develops platform. You'll work with Next.js, TypeScript, and Firebase to deliver features that serve thousands of learners.",
        requirements: ["Basic knowledge of React/Next.js", "Experience with Git/GitHub", "Passion for open source and community building"],
        icon: <Code className="h-8 w-8 text-primary" />
    },
    {
        id: "digital-marketing-internship",
        title: "Digital Marketing Internship",
        description: "Help us amplify our mission. You'll manage social media channels, create engaging content, and work on SEO and community outreach strategies to grow the w3Develops ecosystem.",
        requirements: ["Strong communication skills", "Familiarity with major social media platforms", "Creative mindset for content strategy"],
        icon: <Megaphone className="h-8 w-8 text-primary" />
    }
];

export default function CareersPage() {
    return (
        <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-12">
            <header className="text-center space-y-4">
                <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto">
                    <Briefcase className="h-12 w-12 text-primary" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold font-sans tracking-tight">
                    Build the Future of w3Develops
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                    We are a community-driven organization looking for passionate volunteers to help us scale our impact. Join our core team and gain real-world experience.
                </p>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-secondary/20 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            Why Join Us?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>Work on a platform used by developers globally. Our internships provide direct mentorship, professional networking, and a robust entry for your portfolio.</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>100% Remote & Flexible</li>
                            <li>Direct impact on public goods</li>
                            <li>Real-world tech stack (Next.js, Firebase)</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="bg-secondary/20 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Community Driven
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>w3Develops isn't just a site; it's a movement. We value diversity, transparency, and the rejection of surveillance capitalism in tech education.</p>
                        <p>All roles are currently volunteer-based, focused on high-quality learning and peer-to-peer growth.</p>
                    </CardContent>
                </Card>
            </div>

            <section className="space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold font-sans">Open Roles</h2>
                    <p className="text-muted-foreground">Select a role to learn more and apply.</p>
                </div>

                <div className="grid gap-6">
                    {internalJobs.map((job) => (
                        <Card key={job.id} className="hover:shadow-md transition-all border-l-4 border-l-primary">
                            <CardHeader className="flex flex-row items-start gap-4">
                                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                    {job.icon}
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl">{job.title}</CardTitle>
                                    <CardDescription className="mt-2 text-base">{job.description}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="space-y-2">
                                    <h4 className="font-bold text-sm uppercase tracking-wider text-primary">Requirements:</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        {job.requirements.map(req => <li key={req}>• {req}</li>)}
                                    </ul>
                                </div>
                                <Button asChild size="lg" className="shrink-0">
                                    <Link href={`/careers/apply/${job.id}`}>Apply for this role</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            <footer className="text-center py-12 border-t">
                <p className="text-muted-foreground">
                    Don't see a fit? We're always looking for kind humans. Join our <Link href="/chat" className="text-primary underline">Discord</Link> to get involved!
                </p>
            </footer>
        </div>
    );
}
