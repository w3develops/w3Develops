'use client';

import Link from 'next/link';
import { Shield, FileText, Mail, Lock } from 'lucide-react';

export default function SecurityPage() {
    return (
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
            <header className="mb-12 text-center">
                <Shield className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
                <h1 className="text-4xl md:text-5xl font-bold font-sans">
                    Security Vulnerability Disclosure Policy
                </h1>
                <p className="text-lg text-gray-300 mt-4">
                    How to report security vulnerabilities to w3Develops.
                </p>
            </header>

            <div className="space-y-12">
                <section>
                    <h2 className="text-3xl font-bold font-sans mb-4 border-b-2 border-yellow-400 pb-2">Research Guidelines</h2>
                    <p className="text-gray-300 mb-6">Follow these guidelines when testing and reporting vulnerabilities:</p>
                    <h3 className="text-2xl font-semibold mb-4">Rules</h3>
                    <ul className="list-disc list-inside space-y-3 text-gray-300">
                        <li>Ensure that you are using the latest, stable, and updated versions of the Operating System and Web Browser(s) available to you on your machine.</li>
                        <li>Never attempt non-technical attacks such as social engineering, phishing, or physical attacks against our employees, users, or infrastructure.</li>
                        <li>Perform testing only on our official platforms listed in scope. Do not test on third-party services that may be integrated with w3Develops.</li>
                        <li>Do not attempt to access or modify user data without permission other than your own. Stop immediately if you find sensitive user data.</li>
                        <li>Do not use automated tools that could cause service disruption or violate our terms of service.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-3xl font-bold font-sans mb-4 border-b-2 border-yellow-400 pb-2">Report Requirements</h2>
                    <p className="text-gray-300 mb-6">Your report should include:</p>
                    <ul className="list-disc list-inside space-y-3 text-gray-300">
                        <li>Clear and detailed steps to reproduce the vulnerability.</li>
                        <li>Impact description - what could an attacker do?</li>
                        <li>Evidence - screenshots, code, or examples.</li>
                        <li>Environment - browser, OS, configuration.</li>
                    </ul>
                    <div className="mt-6 space-y-4">
                        <h4 className="text-xl font-semibold">Valid Reports:</h4>
                        <ul className="list-disc list-inside pl-4 space-y-2 text-gray-400">
                            <li>Authentication Bypass</li>
                            <li>SQL injection exposing user data</li>
                            <li>XSS affecting multiple users</li>
                            <li>Remote code execution vulnerabilities</li>
                        </ul>
                        <h4 className="text-xl font-semibold">Invalid Reports:</h4>
                        <ul className="list-disc list-inside pl-4 space-y-2 text-gray-400">
                            <li>SSL scanner warnings</li>
                            <li>Clickjacking on non-sensitive pages</li>
                            <li>Issues requiring local machine access</li>
                            <li>Vulnerabilities requiring admin privileges</li>
                        </ul>
                    </div>
                </section>
                
                 <section>
                    <h2 className="text-3xl font-bold font-sans mb-4 border-b-2 border-yellow-400 pb-2">What We Don't Accept</h2>
                    <h3 className="text-2xl font-semibold mb-4">Automated Reports & "Beg Bounties"</h3>
                    <ul className="list-disc list-inside space-y-3 text-gray-300">
                        <li>Generic tool output without manual verification</li>
                        <li>SSL/DNS configuration warnings</li>
                        <li>Dependency alerts without proof of exploit</li>
                        <li>Subdomain enumeration lists</li>
                    </ul>
                    <p className="text-gray-400 mt-4 italic">We treat low-effort reports as <Link href="https://www.troyhunt.com/beg-bounties" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">"beg bounties"</Link>. These are reports that don't meet our quality standards and are not actionable.</p>
                </section>

                <section>
                    <h2 className="text-3xl font-bold font-sans mb-4 border-b-2 border-yellow-400 pb-2">Low-Impact Issues</h2>
                    <ul className="list-disc list-inside space-y-3 text-gray-300">
                        <li>Self-exploitation vulnerabilities (like installing a malicious extension)</li>
                        <li>Issues requiring extensive social engineering</li>
                        <li>Theoretical vulnerabilities without real impact</li>
                        <li>Problems only affecting outdated OS or browsers</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-3xl font-bold font-sans mb-4 border-b-2 border-yellow-400 pb-2">Third-Party & Non-Security Issues</h2>
                     <ul className="list-disc list-inside space-y-3 text-gray-300">
                        <li>Vulnerabilities in services we don't control</li>
                        <li>Known upstream software issues</li>
                        <li>Regular bugs, feature requests & content violations</li>
                        <li>Physical access requirements</li>
                    </ul>
                </section>
                
                <section className="bg-[#2a2a40] p-6 rounded-lg border border-gray-700">
                    <h2 className="text-3xl font-bold font-sans mb-4 flex items-center gap-2"><Mail className="h-8 w-8 text-yellow-400" />How to Report</h2>
                    <p className="text-gray-300 mb-4">
                        Email your report to <Link href="https://mailxto.com/zdhn3fit2a" target="_blank" rel="noopener noreferrer" className="font-semibold text-yellow-400 hover:underline">our security team</Link>. You can also send us a PGP-encrypted email using <Link href="https://flowcrypt.com/me/w3develops" target="_blank" rel="noopener noreferrer" className="font-semibold text-yellow-400 hover:underline">this form</Link> or our <Link href="https://flowcrypt.com/pub/w3develops?show=pubkey" target="_blank" rel="noopener noreferrer" className="font-semibold text-yellow-400 hover:underline">public key</Link>.
                    </p>
                    <ul className="space-y-2 text-gray-300">
                        <li>We will acknowledge the report, check if it's in scope, and let you know if we need more information.</li>
                        <li>We will analyze the report and may ask for more details for investigation.</li>
                        <li>We will fix confirmed issues and coordinate disclosure timing with you.</li>
                        <li>We will recognize valid reports in our <Link href="/contribute/security/hall-of-fame" className="font-semibold text-yellow-400 hover:underline">Hall of Fame</Link>.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-3xl font-bold font-sans mb-4 border-b-2 border-yellow-400 pb-2">Timeline</h2>
                    <ul className="list-disc list-inside space-y-3 text-gray-300">
                        <li><span className="font-semibold">Acknowledgement:</span> Within 48-72 hours</li>
                        <li><span className="font-semibold">Initial Assessment:</span> Within 5-7 business days</li>
                        <li><span className="font-semibold">Updates:</span> During investigation as needed</li>
                        <li><span className="font-semibold">Disclosure:</span> Within 90 days maximum</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}
