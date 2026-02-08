
'use client';

import { Award } from 'lucide-react';
import Link from 'next/link';

const hallOfFameData = {
    "2026": [
        { name: "Jondevops", profileUrl: "https://github.com/JonDevOps" },
    ]
};

export default function SecurityHallOfFamePage() {
    return (
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
            <header className="mb-12 text-center">
                <Award className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
                <h1 className="text-4xl md:text-5xl font-bold font-sans">
                    Security Hall of Fame
                </h1>
                <p className="text-lg text-gray-300 mt-4">
                    We are grateful to the following security researchers for their responsible disclosure of vulnerabilities.
                </p>
                 <Link href="/contribute/security" className="text-yellow-400 hover:underline mt-4 inline-block">
                    &larr; Back to Security Policy
                </Link>
            </header>

            <div className="space-y-12">
                {Object.entries(hallOfFameData).sort((a, b) => b[0].localeCompare(a[0])).map(([year, contributors]) => (
                    <section key={year}>
                        <h2 className="text-3xl font-bold font-sans mb-6 border-b-2 border-yellow-400 pb-2">{year}</h2>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                            {contributors.map(contributor => (
                                <li key={contributor.name}>
                                    <a 
                                        href={contributor.profileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-lg text-gray-300 hover:text-yellow-400 hover:underline"
                                    >
                                        {contributor.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>

            <div className="mt-16 text-center text-gray-400">
                <p>If you have responsibly disclosed a vulnerability and believe you should be on this list, please contact our security team.</p>
            </div>
        </div>
    );
}
