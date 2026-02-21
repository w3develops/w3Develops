'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, EyeOff, Share2, Database, Unlock } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-8">
            <header className="text-center space-y-4">
                <ShieldCheck className="h-12 w-12 mx-auto text-primary" />
                <h1 className="text-4xl font-headline font-bold">Privacy Policy</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Our attempt at a "Cory Doctorow-approved" policy built on agency, transparency, and the rejection of surveillance capitalism.
                </p>
                <p className="text-sm text-muted-foreground italic font-mono uppercase tracking-widest">
                    Last Hardened: February 7, 2026
                </p>
            </header>

            <Card className="border-2 border-primary/20">
                <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center gap-2">
                        <EyeOff className="h-5 w-5 text-primary" />
                        Our Primary Directive
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="p-3 bg-muted rounded-md border-l-4 border-primary">
                        <p className="text-sm font-bold uppercase">TL;DR:</p>
                        <p className="text-sm">You are our community, not our product. We collect only what we need to keep the site working, and we delete it as soon as we don't need it.</p>
                    </div>
                    <p>
                        Most modern privacy policies are designed to strip you of your rights. Ours is designed to protect them. w3Develops is built on the principle of <strong>Radical Data Minimization</strong>. If a piece of data isn't strictly necessary to provide the service you've requested (like your username for your profile), we don't want it, we don't touch it, and we certainly don't sell it.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        1. Necessary Data Only
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-muted rounded-md border-l-4 border-primary">
                        <p className="text-sm font-bold uppercase">TL;DR:</p>
                        <p className="text-sm">We need an email to verify you're human and a username to show who you are. Everything else is optional and provided at your discretion.</p>
                    </div>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                        <li><strong>Identity:</strong> We store your email and username to manage your account.</li>
                        <li><strong>Activity:</strong> We store the projects you submit and the groups you join because that's the core of our platform.</li>
                        <li><strong>Logs:</strong> Our servers keep temporary logs (like your IP address) for security and debugging. We purge these regularly.</li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-primary" />
                        2. No Surveillance, No Brokers, No Sale
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-muted rounded-md border-l-4 border-primary">
                        <p className="text-sm font-bold uppercase">TL;DR:</p>
                        <p className="text-sm">We will never sell your data to brokers or share it with advertisers. Period.</p>
                    </div>
                    <p>
                        The "sharing" of data is the engine of the surveillance economy. We refuse to participate. We do not use third-party tracking pixels (like Meta or Google Tag Manager) that follow you across the web. Your presence here is private.
                    </p>
                    <p className="font-semibold text-foreground">We share data only in these three extreme cases:</p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                        <li><strong>Functional Necessity:</strong> Using services like Firebase to actually run the database.</li>
                        <li><strong>Legal Process:</strong> If we are served a valid warrant. See our <a href="/warrant-canary" className="text-primary underline">Warrant Canary</a>.</li>
                        <li><strong>Safety:</strong> To prevent a direct, credible threat of physical harm.</li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Unlock className="h-5 w-5 text-primary" />
                        3. Your Agency & Data Portability
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-muted rounded-md border-l-4 border-primary">
                        <p className="text-sm font-bold uppercase">TL;DR:</p>
                        <p className="text-sm">You own your data. You can take it with you or delete it whenever you want.</p>
                    </div>
                    <p>
                        Enshittification happens when platforms make it hard for users to leave. We reject this. You have the absolute right to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                        <li><strong>Export:</strong> Download every scrap of data we have on you.</li>
                        <li><strong>Deletion:</strong> Delete your account and every associated record. We don't "ghost" your data in backup archives indefinitely.</li>
                        <li><strong>Interoperability:</strong> You have the right to build or use third-party tools to interact with your data here. We will not use the DMCA to stop you.</li>
                    </ul>
                </CardContent>
            </Card>

            <Card className="bg-primary/5">
                <CardHeader>
                    <CardTitle>4. Contact & Integrity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>
                        Privacy policies are often used as "gotchas." We intend for this to be a promise. If you feel we have failed to live up to these standards, or if you have questions about how we treat your information, contact us immediately:
                    </p>
                    <p className="font-mono text-center py-4 bg-background border rounded">
                        privacy@w3develops.org
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}