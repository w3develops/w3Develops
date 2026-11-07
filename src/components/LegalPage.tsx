import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Shared layout for the privacy, cookies and terms pages, so all three
// read the same way: a plain-language summary first, then the details
export function LegalPage({ icon, title, intro, lastUpdated, children }: {
    icon: ReactNode;
    title: string;
    intro: ReactNode;
    lastUpdated: string;
    children: ReactNode;
}) {
    return (
        <div className="max-w-3xl mx-auto p-4 md:p-10 space-y-8">
            <header className="text-center space-y-4">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit text-primary">
                    {icon}
                </div>
                <h1 className="text-4xl font-headline font-bold">{title}</h1>
                <div className="text-muted-foreground max-w-2xl mx-auto space-y-2">{intro}</div>
                <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
            </header>
            {children}
        </div>
    );
}

export function LegalSection({ title, summary, children }: {
    title: string;
    summary?: string;
    children: ReactNode;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 leading-relaxed">
                {summary && (
                    <p className="p-3 bg-muted rounded-md border-l-4 border-primary text-sm">
                        <span className="font-semibold">In short: </span>{summary}
                    </p>
                )}
                {children}
            </CardContent>
        </Card>
    );
}
