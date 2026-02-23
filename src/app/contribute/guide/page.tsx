'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    BookOpen, 
    Code2, 
    MessageSquare, 
    Terminal, 
    Zap, 
    ShieldCheck, 
    Heart,
    GitPullRequest,
    Layers
} from 'lucide-react';
import Link from 'next/link';

const guideSections = [
    {
        title: "1. Join the Community",
        icon: <MessageSquare className="h-6 w-6 text-primary" />,
        description: "The heartbeat of w3Develops is our Discord server. Join to meet other contributors, ask questions, and find where help is needed most.",
        link: "/chat",
        linkText: "Join Discord"
    },
    {
        title: "2. Explore the Codebase",
        icon: <Terminal className="h-6 w-6 text-primary" />,
        description: "Our main repositories are on GitHub. We value clean, readable code and follow a 'radical minimization' approach to dependencies.",
        link: "https://github.com/w3develops",
        linkText: "GitHub Repositories"
    },
    {
        title: "3. Documentation & Content",
        icon: <BookOpen className="h-6 w-6 text-primary" />,
        description: "Not every contribution is code. Help us improve our learning resources, update documentation, or write articles for the community blog.",
        link: "/learn",
        linkText: "Learning Resources"
    }
];

export default function ContributorGuidePage() {
    return (
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
            <header className="mb-12 text-center space-y-4">
                <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto">
                    <Layers className="h-12 w-12 text-primary" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold font-sans">
                    Contributor Guide
                </h1>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                    How to help build the world's most transparent and user-centric developer community.
                </p>
                <Link href="/contribute" className="text-primary hover:underline flex items-center justify-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Contribute
                </Link>
            </header>

            <div className="space-y-12">
                <section>
                    <Card className="bg-[#1b1b32] border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-yellow-400" />
                                Our Contribution Philosophy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-gray-300 space-y-4">
                            <p>
                                We believe in building <strong>Public Goods</strong>. w3Develops is not a product; it is a community infrastructure. When you contribute, you aren't just "fixing bugs"—you are helping build a platform that rejects enshittification and surveillance capitalism.
                            </p>
                            <p>
                                We prioritize <strong>Human Agency</strong>. Every feature we build and every line of code we write should empower the user, not the platform.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6">
                    <h2 className="text-3xl font-bold font-sans border-b-2 border-primary/20 pb-2">Where to Start</h2>
                    <div className="grid md:grid-cols-1 gap-6">
                        {guideSections.map((section) => (
                            <Card key={section.title} className="bg-[#2a2a40] border-gray-700">
                                <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div className="flex gap-4">
                                        <div className="mt-1">{section.icon}</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{section.title}</h3>
                                            <p className="text-gray-400 mt-1">{section.description}</p>
                                        </div>
                                    </div>
                                    <Button asChild variant="outline" className="flex-shrink-0 border-primary text-primary hover:bg-primary/10 hover:text-primary">
                                        <Link href={section.link} target={section.link.startsWith('http') ? "_blank" : undefined}>
                                            {section.linkText}
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-3xl font-bold font-sans border-b-2 border-primary/20 pb-2">Code Workflow</h2>
                    <div className="bg-black/30 p-6 rounded-lg border border-gray-800 space-y-4">
                        <div className="flex items-start gap-4">
                            <GitPullRequest className="h-6 w-6 text-green-400 mt-1" />
                            <div>
                                <h4 className="text-xl font-semibold text-white">The PR Process</h4>
                                <ul className="list-disc list-inside mt-2 text-gray-400 space-y-2">
                                    <li>Fork the repository and create a descriptive branch name.</li>
                                    <li>Reference an open issue in your Pull Request description.</li>
                                    <li>Ensure your code follows our existing patterns (TypeScript, Tailwind, ShadCN).</li>
                                    <li>Be prepared for a friendly peer review!</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <Card className="bg-primary/5 border-primary/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                Community Standards
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-gray-300">
                            <p>
                                Be kind. We are a global community of learners and mentors. We have zero tolerance for harassment, elitism, or exclusion. If you see something that violates our community standards, report it immediately to the moderators on Discord.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                <div className="text-center pt-8">
                    <p className="text-gray-400 mb-4 italic">Ready to dive in?</p>
                    <Button asChild size="lg" className="bg-primary text-black hover:bg-yellow-400 font-bold px-12">
                        <Link href="https://github.com/w3develops">
                            Explore Active Issues
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
