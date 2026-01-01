
'use client';

import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Users, Code, BookOpen, MessageSquare, GraduationCap, Hammer, Trophy, GitBranch, Rss, Briefcase, Podcast, Factory, School } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const navLinks = [
    { href: "/learn", label: "Learn", icon: School },
    { href: "/studygroups", label: "Study Groups", icon: Users },
    { href: "/groupprojects", label: "Group Projects", icon: Code },
    { href: "/solo-projects", label: "Solo Projects", icon: Code },
    { href: "/book-clubs", label: "Book Clubs", icon: BookOpen },
    { href: "/meetups", label: "Meetups", icon: Users },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/pair-programming", label: "Pair Programming", icon: GitBranch },
    { href: "/competitions", label: "Competitions", icon: Trophy },
    { href: "/hackathons", label: "Hackathons", icon: Hammer },
    { href: "/hackerspaces", label: "Hackerspaces", icon: Factory },
    { href: "/job-board", label: "Job Board", icon: Briefcase },
    { href: "/tutor", label: "Tutor", icon: GraduationCap },
    { href: "/mentorship", label: "Mentorship", icon: Users },
    { href: "/podcast", label: "Podcast", icon: Podcast },
    { href: "/news", label: "News", icon: Rss },
];


export default function Sidebar() {
    const [open, setOpen] = useState(false);

    const handleLinkClick = () => {
        setOpen(false);
    };

    const sidebarContent = (
         <nav className="flex flex-col h-full text-foreground">
             <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                     <Image src="/logo.png" alt="w3Develops Logo" width={32} height={32} className="rounded-full" priority />
                     <span className="">w3Develops</span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="grid items-start gap-1 p-2 lg:p-4">
                     {navLinks.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href + label}
                            href={href}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            onClick={handleLinkClick}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-white/80"
                >
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Navigation</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 bg-card">
                {sidebarContent}
            </SheetContent>
        </Sheet>
    )
}
