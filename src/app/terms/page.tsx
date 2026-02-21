'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Scale, messageSquare, Zap, Gavel, FileCode, DoorOpen, Terminal } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-8">
            <header className="text-center space-y-4">
                <Scale className="h-12 w-12 mx-auto text-primary" />
                <h1 className="text-4xl font-headline font-bold">Terms of Use</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Our attempt at a "Cory Doctorow-approved" terms of service built on agency, transparency, and the rejection of enshittification.
                </p>
                <p className="text-sm text-muted-foreground italic font-mono uppercase tracking-widest">
                    Last Hardened: February 7, 2026
                </p>
            </header>

            <Card className="border-2 border-primary/20">
                <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        The Golden Rule
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="p-3 bg-muted rounded-md border-l-4 border-primary">
                        <p className="text-sm font-bold uppercase">TL;DR:</p>
                        <p className="text-sm">We provide the tools, you provide the talent. Don't be a jerk, and we won't treat you like a product.</p>
                    </div>
                    <p>
                        These Terms are not a trap. They are a mutual agreement between peers. By using w3Develops, you agree to respect the community and the platform, and we agree to respect your rights as an individual.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-primary" />
                        1. The Right to Interoperate
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-muted rounded-md border-l-4 border-primary">
                        <p className="text-sm font-bold uppercase">TL;DR:</p>
                        <p className="text-sm">You have the right to build tools that interact with your data. We won't sue you for being creative with how you use the site.</p>
                    </div>
                    <p>
                        We reject the use of the DMCA or "Computer Fraud and Abuse" laws to prevent **Adversarial Interoperability**. You have the right to build alternative clients, bots, or scrapers to interact with your own data or public community data, provided they do not disrupt the service for others. We will never use legal threats to stop you from building tools that help you leave or improve your experience.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileCode className="h-5 w-5 text-primary" />
                        2. User Content & Ownership
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-muted rounded-md border-l-4 border-primary">
                        <p className="text-sm font-bold uppercase">TL;DR:</p>
                        <p className="text-sm">Your code is yours. We only ask for the minimum permission needed to show it to the community.</p>
                    </div>
                    <p>
                        You retain full ownership of the code, text, and projects you submit. When you post content, you grant us a non-exclusive license to display it on the platform. We encourage you to use **Open Source** or **Creative Commons** licenses for your work, ensuring that the community can learn from and build upon your contributions.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gavel className="h-5 w-5 text-primary" />
                        3. No Forced Arbitration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-muted rounded-md border-l-4 border-primary">
                        <p className="text-sm font-bold uppercase">TL;DR:</p>
                        <p className="text-sm">If we have a legal dispute, you keep your right to go to a real court. No secret private "arbitration" here.</p>
                    </div>
                    <p>
                        Many platforms use "Forced Arbitration" to strip users of their day in court. We find this practice abhorrent. If a legal dispute arises that cannot be settled through a simple conversation, you retain the right to resolve it in a court of law or participate in a class-action lawsuit.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DoorOpen className="h-5 w-5 text-primary" />
                        4. Freedom to Leave
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-muted rounded-md border-l-4 border-primary">
                        <p className="text-sm font-bold uppercase">TL;DR:</p>
                        <p className="text-sm">We won't hold your data hostage. You can export your info and delete your account at any time.</p>
                    </div>
                    <p>
                        Platform lock-in is a form of digital serfdom. We commit to **Data Portability**. You can export your data and delete your account whenever you choose. We will not create "roach motels" where it's easy to check in but impossible to leave.
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-primary/5">
                <CardHeader>
                    <CardTitle>5. Community Integrity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>
                        The only way this works is if we treat each other with respect. Harassment, spam, and malicious disruption are the only things that will get you shown the door.
                    </p>
                    <p className="font-semibold text-center py-4">
                        Questions or concerns? reach out: legal@w3develops.org
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
