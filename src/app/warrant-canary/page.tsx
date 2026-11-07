import type { Metadata } from 'next';
import { Bird } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pageMetadata } from '@/lib/site-pages';

export const metadata: Metadata = pageMetadata('/warrant-canary');

// Update both dates every time the statement is renewed
const lastUpdated = 'November 2, 2026';
const nextUpdate = 'February 1, 2027';

export default function WarrantCanaryPage() {
    return (
        <div className="max-w-3xl mx-auto p-4 md:p-10">
            <Card className="bg-card">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <Bird className="h-16 w-16 text-primary" />
                    </div>
                    <CardTitle as="h1" className="font-headline text-4xl">Warrant Canary</CardTitle>
                    <CardDescription className="text-lg">
                        Last updated: {lastUpdated}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-lg space-y-6">
                    <p>
                        This is a "warrant canary." It is a statement which we will publish on a regular basis, as long as it is true. If this statement is ever removed, or if it is not updated in a timely fashion, our users should assume that we have received a secret warrant or some other legal process that we are not at liberty to discuss.
                    </p>

                    <blockquote className="bg-muted p-6 rounded-md border-l-4 border-primary space-y-4">
                        <p>As of {lastUpdated}:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>w3Develops has never received a National Security Letter, a FISA court order, or any other secret legal process that we would be prohibited from disclosing.</li>
                            <li>w3Develops has never received a warrant, subpoena or court order for information about our members.</li>
                            <li>w3Develops has never been ordered to change our systems to allow access to, or monitoring of, our members' information.</li>
                        </ul>
                        <p>The next update to this statement will be published on or before {nextUpdate}.</p>
                    </blockquote>

                    <div className="text-sm text-muted-foreground pt-4">
                        <h2 className="font-semibold mb-2">What is a Warrant Canary?</h2>
                        <p>
                            Many service providers are forbidden from revealing to their users that they have been served with a secret government subpoena. A warrant canary is a colloquial term for a regularly published statement that a service provider has <span className="italic">not</span> received such a subpoena. If the canary is not updated in a timely manner, or if it is removed, the absence of the statement implies that the provider <span className="italic">has</span> received such a secret subpoena. For more information, see the <a href="https://en.wikipedia.org/wiki/Warrant_canary" target="_blank" rel="noopener noreferrer" className="text-primary underline">Wikipedia article on Warrant Canaries</a>.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
