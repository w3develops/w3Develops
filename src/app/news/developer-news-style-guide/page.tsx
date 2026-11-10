import type { Metadata } from 'next';
import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { pageMetadata } from '@/lib/site-pages';

export const metadata: Metadata = pageMetadata('/news/developer-news-style-guide');

const linkClass = 'text-primary underline';

export default function DeveloperNewsStyleGuidePage() {
    return (
        <LegalPage
            icon={<PenLine className="h-10 w-10" />}
            title="Developer News Style Guide"
            lastUpdated="November 10, 2026"
            intro={
                <>
                    <p>
                        This guide is for anyone writing for w3Develops: tutorials, project write-ups, community updates
                        and news posts. It keeps our articles clear, accurate and welcoming, whoever writes them.
                    </p>
                    <p className="font-semibold text-foreground">
                        In short: write for a beginner, show your sources, and test your code.
                    </p>
                </>
            }
        >
            <LegalSection
                title="What we publish"
                summary="Useful writing for developers at every level."
            >
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Tutorials</strong> that walk through building or fixing something, step by step.</li>
                    <li><strong>Project write-ups</strong> from study groups, group projects and hackathons: what you built and what you learned.</li>
                    <li><strong>Community updates</strong> about groups, book clubs, meetups and competitions on w3Develops.</li>
                    <li><strong>News posts</strong> that sum up what happened in tech and why it matters to developers.</li>
                </ul>
                <p>
                    We don&apos;t publish ads, press releases, paid placements, or anything you don&apos;t have the right to
                    share.
                </p>
            </LegalSection>

            <LegalSection
                title="Voice"
                summary="Plain, friendly and direct, like explaining something to a classmate."
            >
                <ul className="list-disc pl-6 space-y-2">
                    <li>Use short sentences and everyday words. Many readers are learning English as well as code.</li>
                    <li>Talk to the reader as &ldquo;you&rdquo;, and write in the active voice: &ldquo;Run the tests&rdquo;, not &ldquo;The tests should be run&rdquo;.</li>
                    <li>Explain a technical term the first time you use it, or link to a good explanation.</li>
                    <li>Skip words like &ldquo;simply&rdquo;, &ldquo;just&rdquo;, &ldquo;obviously&rdquo; and &ldquo;easy&rdquo;. If a step is easy, the reader will notice.</li>
                    <li>No hype or clickbait. A headline should tell the reader what they&apos;ll get, not tease it.</li>
                </ul>
            </LegalSection>

            <LegalSection
                title="Structure"
                summary="Say what the article is about straight away, then make it easy to scan."
            >
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Title:</strong> sentence case, under about 70 characters, and specific: &ldquo;Build a to-do app with React and Firebase&rdquo;.</li>
                    <li><strong>Opening:</strong> two or three sentences on what the reader will learn or build, and what they need to know first.</li>
                    <li><strong>Headings</strong> for each step or idea, so readers can jump to the part they need.</li>
                    <li><strong>Short paragraphs</strong>, and lists for steps or options.</li>
                    <li><strong>Ending:</strong> sum up, and point to a next step, like a related article, the full code, or a study group on the topic.</li>
                </ul>
            </LegalSection>

            <LegalSection
                title="Code"
                summary="Every code sample should run as written."
            >
                <ul className="list-disc pl-6 space-y-2">
                    <li>Test every sample before you publish, and say which versions you used, like Node 20 or React 19.</li>
                    <li>Put code in code blocks marked with the language, and keep each block short enough to follow.</li>
                    <li>Explain what each block does, especially lines a beginner might copy without understanding.</li>
                    <li>Use <code>inline code</code> for file names, commands, functions and variables.</li>
                    <li>Never include real passwords, API keys or tokens. Use placeholders like <code>YOUR_API_KEY</code>.</li>
                    <li>Link to the full code on GitHub when a project is too big for the article.</li>
                </ul>
            </LegalSection>

            <LegalSection
                title="Accuracy and sources"
                summary="Link what you rely on, and write in your own words."
            >
                <ul className="list-disc pl-6 space-y-2">
                    <li>Link to the original source for facts, numbers and news: the official docs, announcement or study, not a post about it.</li>
                    <li>Summarize in your own words. Quote only a sentence or two, in quotation marks, with credit and a link.</li>
                    <li>Don&apos;t copy articles, tutorials or docs, even with credit.</li>
                    <li>Give dates for anything that changes, like prices, versions or release plans.</li>
                    <li>If you find a mistake after publishing, fix it and add a short note at the end saying what changed.</li>
                </ul>
            </LegalSection>

            <LegalSection
                title="Images"
                summary="Use images you have the right to use, and describe them."
            >
                <ul className="list-disc pl-6 space-y-2">
                    <li>Use your own screenshots and images, or ones with a license that allows reuse, and credit the source.</li>
                    <li>Give every image alt text that says what it shows, for readers using screen readers.</li>
                    <li>Check screenshots for private details, like email addresses, names or open tabs, and blur them.</li>
                </ul>
            </LegalSection>

            <LegalSection
                title="Writing with AI"
                summary="AI can help, but you're responsible for every word."
            >
                <p>
                    You may use AI tools to help draft, edit or check your writing. Check every fact, link and code sample
                    yourself, and say at the end of the article if AI helped write it. w3Develops&apos; own scheduled posts
                    are labeled when AI helped write them.
                </p>
            </LegalSection>

            <LegalSection
                title="Words, names and numbers"
                summary="Write for a global audience."
            >
                <ul className="list-disc pl-6 space-y-2">
                    <li>Spell names the way their owners do: JavaScript, GitHub, Node.js, w3Develops.</li>
                    <li>Write dates as &ldquo;November 10, 2026&rdquo; and give times in UTC, so readers in every time zone can convert them.</li>
                    <li>Use inclusive language: &ldquo;they&rdquo; for an unknown person, &ldquo;allowlist&rdquo; and &ldquo;main branch&rdquo;, and no jokes at any group&apos;s expense.</li>
                    <li>Spell out an abbreviation the first time, like &ldquo;continuous integration (CI)&rdquo;.</li>
                </ul>
            </LegalSection>

            <LegalSection
                title="Before you submit"
                summary="A quick checklist."
            >
                <ul className="list-disc pl-6 space-y-2">
                    <li>The title and opening say what the reader gets.</li>
                    <li>Every code sample runs, and every link works.</li>
                    <li>Sources are linked, and nothing is copied.</li>
                    <li>Images have alt text and no private details.</li>
                    <li>You&apos;ve read it out loud once. Awkward sentences are easy to hear.</li>
                </ul>
                <p>
                    Want to write for w3Develops? Share your idea in our{' '}
                    <Link href="https://discord.gg/ckQ52gA" className={linkClass}>Discord</Link>. Everyone taking part follows
                    our <Link href="/code-of-conduct" className={linkClass}>Code of Conduct</Link>.
                </p>
            </LegalSection>
        </LegalPage>
    );
}
