'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WarrantCanaryPage() {
    const lastUpdated = "November 28, 2025";
    const nextUpdate = "December 28, 2025";

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-10">
            <Card className="bg-card">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <Shield className="h-16 w-16 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-4xl">Warrant Canary</CardTitle>
                    <CardDescription className="text-lg">
                        Last Updated: {lastUpdated}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-lg space-y-6">
                    <p>
                        This is a "warrant canary." It is a statement which we will publish on a regular basis, as long as it is true. If this statement is ever removed, or if it is not updated in a timely fashion, our users should assume that we have received a secret warrant or some other legal process that we are not at liberty to discuss.
                    </p>
                    <div className="border-l-4 border-primary pl-4 py-2 bg-secondary/30 rounded-r-lg">
                        <p className="font-semibold">
                            As of the date of this statement, w3Develops has never received any secret legal process that we would be prohibited from disclosing to the public. We have never been ordered to modify our system to allow access or information gathering.
                        </p>
                    </div>
                    <p>
                        This statement is signed by our private PGP key. You can verify its authenticity by importing our public key and checking the signature. We chose not to automate this process to prevent a compromised server from automatically generating a false canary.
                    </p>
                     <p>
                        The next scheduled update for this page is on or before <span className="font-semibold">{nextUpdate}</span>.
                    </p>

                    <div className="text-sm text-muted-foreground pt-4">
                        <h4 className="font-semibold mb-2">What is a Warrant Canary?</h4>
                        <p>
                            Many service providers are forbidden from revealing to their users that they have been served with a secret government subpoena. A warrant canary is a colloquial term for a regularly published statement that a service provider has <span className="italic">not</span> received such a subpoena. If the canary is not updated in a timely manner, or if it is removed, the absence of the statement implies that the provider <span className="italic">has</span> received such a secret subpoena. For more information, see the <Link href="https://en.wikipedia.org/wiki/Warrant_canary" target="_blank" rel="noopener noreferrer" className="text-primary underline">Wikipedia article on Warrant Canaries</Link>.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
