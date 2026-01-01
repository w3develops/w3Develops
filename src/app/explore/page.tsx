
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import {
    Users, Code, BookOpen, MessageSquare, GraduationCap, Hammer, Trophy, GitBranch, Rss, Briefcase, Podcast, Factory, School, LifeBuoy, HandCoins, Store
} from "lucide-react";

const mainLinks = [
    { href: "/learn", label: "Learn", icon: School, description: "Curated resources to learn new skills." },
    { href: "/studygroups", label: "Study Groups", icon: Users, description: "Find a group to learn and grow with." },
    { href: "/groupprojects", label: "Group Projects", icon: Code, description: "Build real-world projects in a team." },
];

const communityLinks = [
     { href: "/chat", label: "Chat", icon: MessageSquare, description: "Join the conversation on Discord." },
     { href: "/book-clubs", label: "Book Clubs", icon: BookOpen, description: "Join community book discussions." },
     { href: "/meetups", label: "Meetups", icon: Users, description: "Find developer meetups in your area." },
     { href: "/news", label: "News", icon: Rss, description: "The latest from the community." },
     { href: "/podcast", label: "Podcast", icon: Podcast, description: "Listen to our latest episodes." },
];

const developmentLinks = [
    { href: "/solo-projects", label: "Solo Projects", icon: Code, description: "Showcase your individual work." },
    { href: "/pair-programming", label: "Pair Programming", icon: GitBranch, description: "Find a partner and code together." },
    { href: "/competitions", label: "Competitions", icon: Trophy, description: "Test your skills in coding challenges." },
    { href: "/hackathons", label: "Hackathons", icon: Hammer, description: "Innovate and build in hackathons." },
    { href: "/hackerspaces", label: "Hackerspaces", icon: Factory, description: "Find local maker communities." },
];

const careerLinks = [
    { href: "/job-board", label: "Job Board", icon: Briefcase, description: "Find your next tech opportunity." },
    { href: "/tutor", label: "Tutor", icon: GraduationCap, description: "Get help from experienced tutors." },
    { href: "/mentorship", label: "Mentorship", icon: Users, description: "Find a mentor to guide your career." },
];

const Section = ({ title, links }: { title: string, links: typeof mainLinks }) => (
    <section className="space-y-4">
        <h2 className="pb-2 text-2xl font-semibold w-fit border-b-4 border-foreground">{title}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {links.map(({ href, label, icon: Icon, description }) => (
                <Link href={href} key={href}>
                    <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-transform duration-300">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Icon className="h-8 w-8 text-primary" />
                            <CardTitle>{label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{description}</p>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    </section>
);

export default function ExplorePage() {
    return (
        <div className="p-4 md:p-10 space-y-12">
            <div className="text-center">
                <h1 className="text-3xl font-headline">Explore w3Develops</h1>
                <p className="text-muted-foreground">Discover all the ways you can learn, build, and connect with the community.</p>
            </div>

            <Section title="Core Features" links={mainLinks} />
            <Section title="Community" links={communityLinks} />
            <Section title="Development & Collaboration" links={developmentLinks} />
            <Section title="Career Growth" links={careerLinks} />
        </div>
    );
}
