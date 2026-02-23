'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Layers,
    Search,
    CheckCircle2,
    Info,
    History,
    Users,
    Github,
    Flag,
    Lightbulb
} from 'lucide-react';
import Link from 'next/link';

const steps = [
    {
        title: "1. Find a Task",
        icon: <Search className="h-6 w-6 text-primary" />,
        description: "Browse our GitHub issues. Look for the 'good first issue' label if you're new. Don't be afraid to ask for clarification on the issue thread.",
    },
    {
        title: "2. Fork and Clone",
        icon: <Layers className="h-6 w-6 text-primary" />,
        description: "Create your own copy of the repository by clicking 'Fork'. Then, clone it to your local machine using 'git clone'.",
    },
    {
        title: "3. Create a Branch",
        icon: <GitPullRequest className="h-6 w-6 text-primary" />,
        description: "Never work on the main branch. Create a feature branch with a descriptive name like 'fix/header-logo' or 'feat/blog-comments'.",
    },
    {
        title: "4. Code and Test",
        icon: <Code2 className="h-6 w-6 text-primary" />,
        description: "Write your code, following our project standards. Ensure your changes don't break existing functionality by testing locally.",
    },
    {
        title: "5. Submit a PR",
        icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
        description: "Push your branch to your fork and click 'New Pull Request'. Explain your changes clearly and link to the relevant issue.",
    }
];

export default function ContributorGuidePage() {
    return (
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-5xl">
            <header className="mb-16 text-center space-y-4">
                <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto">
                    <Layers className="h-12 w-12 text-primary" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold font-sans tracking-tight">
                    The Ultimate Guide to Contributing
                </h1>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                    w3Develops is built by thousands of volunteers around the world. Whether you're a seasoned pro or just starting out, your help makes a difference.
                </p>
                <Link href="/contribute" className="text-primary hover:underline flex items-center justify-center gap-2 pt-4">
                    <ArrowLeft className="h-4 w-4" /> Back to Contribute
                </Link>
            </header>

            <div className="space-y-20">
                {/* Section 1: Intro */}
                <section className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold font-sans">Why Contribute to Open Source?</h2>
                        <div className="space-y-4 text-gray-300">
                            <div className="flex gap-4">
                                <div className="bg-green-500/20 p-2 rounded-lg h-fit mt-1"><Heart className="h-5 w-5 text-green-400" /></div>
                                <div>
                                    <h4 className="font-bold text-white">Build a Public Good</h4>
                                    <p>Help create tools that belong to everyone, not just corporations. Your code directly impacts thousands of learners.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-blue-500/20 p-2 rounded-lg h-fit mt-1"><Zap className="h-5 w-5 text-blue-400" /></div>
                                <div>
                                    <h4 className="font-bold text-white">Sharpen Your Skills</h4>
                                    <p>Get real-world experience with professional workflows, code reviews, and modern tech stacks (React, Next.js, Firebase).</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-purple-500/20 p-2 rounded-lg h-fit mt-1"><Users className="h-5 w-5 text-purple-400" /></div>
                                <div>
                                    <h4 className="font-bold text-white">Network with Peers</h4>
                                    <p>Meet other developers, mentors, and maintainers. Open source is one of the best ways to get noticed by hiring managers.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Card className="bg-[#1b1b32] border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5 text-yellow-400" />
                                Our Ethics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-gray-300 space-y-4">
                            <p>
                                We follow <strong>Radical Data Minimization</strong> and <strong>Interoperability</strong>. 
                            </p>
                            <p>
                                We reject "enshittification" and surveillance. Every feature you build should empower the user and respect their digital sovereignty.
                            </p>
                            <Button asChild variant="link" className="p-0 text-primary h-auto">
                                <Link href="/privacy">Read our full Privacy Manifesto &rarr;</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 2: Technical Workflow */}
                <section className="space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold font-sans">The Contribution Workflow</h2>
                        <p className="text-gray-400">A step-by-step guide to your first Pull Request.</p>
                    </div>
                    
                    <div className="grid md:grid-cols-5 gap-4">
                        {steps.map((step, i) => (
                            <div key={i} className="relative space-y-4 group">
                                <div className="bg-[#2a2a40] p-6 rounded-xl border border-gray-700 h-full transition-all group-hover:border-primary/50">
                                    <div className="mb-4">{step.icon}</div>
                                    <h3 className="font-bold text-white mb-2">{step.title}</h3>
                                    <p className="text-sm text-gray-400">{step.description}</p>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -right-2 -translate-y-1/2 z-10 text-gray-600">
                                        &rarr;
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section 3: Technical Details */}
                <section className="grid md:grid-cols-3 gap-8">
                    <Card className="bg-black/30 border-gray-800 md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Terminal className="h-6 w-6 text-primary" />
                                Technical Standards
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h4 className="font-bold text-white flex items-center gap-2"><Layers className="h-4 w-4" /> Tech Stack</h4>
                                    <ul className="text-sm text-gray-400 space-y-1">
                                        <li>Next.js 14/15 (App Router)</li>
                                        <li>TypeScript (Strongly Typed)</li>
                                        <li>Tailwind CSS & ShadCN UI</li>
                                        <li>Firebase Client SDK</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-white flex items-center gap-2"><GitPullRequest className="h-4 w-4" /> Commit Rules</h4>
                                    <ul className="text-sm text-gray-400 space-y-1">
                                        <li>Use descriptive commit messages.</li>
                                        <li>Atomic commits (one fix/feature per commit).</li>
                                        <li>Reference issues: "closes #123".</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                                <h4 className="font-bold text-primary mb-2">Wait for the PR Review</h4>
                                <p className="text-sm text-gray-300">
                                    Once you submit, a maintainer will review your code. We prioritize constructive feedback. Don't take suggestions personally—it's part of the craft!
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#2a2a40] border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-xl">Beyond Code</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-gray-400">
                            <p className="text-sm">You don't have to write code to help us grow:</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
                                    <span className="text-sm"><strong className="text-white">Documentation:</strong> Improve tutorials or clear up confusing docs.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
                                    <span className="text-sm"><strong className="text-white">Issue Triaging:</strong> Help verify bugs or label incoming requests.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Users className="h-5 w-5 text-primary flex-shrink-0" />
                                    <span className="text-sm"><strong className="text-white">Community:</strong> Answer questions in our Discord and help new members.</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 4: Code of Conduct */}
                <section className="bg-primary/5 border border-primary/30 rounded-2xl p-8 md:p-12 text-center space-y-6">
                    <ShieldCheck className="h-16 w-16 mx-auto text-primary" />
                    <h2 className="text-3xl font-bold">Community Standards</h2>
                    <p className="text-gray-300 max-w-2xl mx-auto text-lg">
                        We are a community of kindness. We have a zero-tolerance policy for harassment, elitism, or exclusion. 
                        <strong> Always assume positive intent</strong> and stay curious.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 pt-4">
                        <Button asChild size="lg" className="font-bold">
                            <Link href="/chat">Join our Discord Community</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10">
                            <Link href="https://github.com/w3develops" target="_blank">
                                <Github className="h-5 w-5 mr-2" />
                                Explore GitHub Issues
                            </Link>
                        </Button>
                    </div>
                </section>

                {/* Section 5: External Resources */}
                <section className="space-y-6 text-center pb-12">
                    <h3 className="text-2xl font-bold">New to Open Source?</h3>
                    <p className="text-gray-400">Here are some great external resources to help you get started:</p>
                    <div className="flex flex-wrap justify-center gap-6">
                        <Link href="https://opensource.guide/how-to-contribute/" target="_blank" className="text-gray-300 hover:text-primary underline">Open Source Guide</Link>
                        <Link href="https://www.freecodecamp.org/news/how-to-contribute-to-open-source-projects-beginners-guide/" target="_blank" className="text-gray-300 hover:text-primary underline">freeCodeCamp Guide</Link>
                        <Link href="https://github.com/firstcontributions/first-contributions" target="_blank" className="text-gray-300 hover:text-primary underline">First Contributions Repo</Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
