import type { Metadata } from 'next';
import Link from 'next/link';
import { HeartHandshake } from 'lucide-react';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { pageMetadata } from '@/lib/site-pages';

export const metadata: Metadata = pageMetadata('/code-of-conduct');

const linkClass = 'text-primary underline';

export default function CodeOfConductPage() {
    return (
        <LegalPage
            icon={<HeartHandshake className="h-10 w-10" />}
            title="Code of Conduct"
            lastUpdated="November 8, 2026"
            intro={
                <>
                    <p>
                        w3Develops is a friendly place to learn to code and build things together, and we want to keep it
                        that way. By taking part, on the site or in any of our community spaces, you agree to follow this
                        code of conduct.
                    </p>
                    <p className="font-semibold text-foreground">In short: be kind. No harassment, trolling or spam.</p>
                </>
            }
        >
            <LegalSection
                title="Where it applies"
                summary="Everywhere w3Develops meets: the site, Discord, social media, video calls and events."
            >
                <p>
                    This code covers the w3Develops site (profiles, groups, check-ins, notes and competitions) and every
                    community space we run, including Discord, our social media accounts, study group and project calls,
                    and meetups.
                </p>
            </LegalSection>

            <LegalSection
                title="What we expect"
                summary="Help each other learn, and assume good intentions."
            >
                <ul className="list-disc pl-6 space-y-2">
                    <li>Be patient and welcoming. Everyone here started as a beginner, and some people still are.</li>
                    <li>Give feedback on code and ideas, not on people.</li>
                    <li>Show up for your group or project, and say so if you can&apos;t.</li>
                    <li>Credit other people&apos;s work, and share only what you have the right to share.</li>
                </ul>
            </LegalSection>

            <LegalSection
                title="What isn't allowed"
                summary="Harassment, trolling and spam."
            >
                <p>
                    <strong>Harassment</strong> includes sexual language or images, threats or deliberate intimidation,
                    stalking, name-calling, unwanted attention, spreading false claims about someone, sharing their private
                    information, and any malicious hacking or social engineering. w3Develops should be free of harassment
                    for everyone, whatever their gender, gender identity or expression, age, sexual orientation, disability,
                    appearance, body size, race, ethnicity, nationality, religion or lack of one, or experience level.
                </p>
                <p>
                    <strong>Trolling</strong> means posting things meant to provoke people or derail a discussion.
                </p>
                <p>
                    <strong>Spam</strong> means posting off-topic messages to disrupt a discussion, promote a product,
                    ask for money, advertise jobs or gigs outside the <Link href="/job-board" className={linkClass}>job board</Link>,
                    or flooding a space with files or text.
                </p>
                <p>
                    Bots and automated accounts aren&apos;t allowed without written permission from the w3Develops team.
                </p>
            </LegalSection>

            <LegalSection
                title="Reporting a problem"
                summary="Tell us, with a screenshot and a link if you can."
            >
                <p>
                    If you see someone harass, troll or spam anywhere in the community, email{' '}
                    <a href="mailto:team@w3develops.org" className={linkClass}>team@w3develops.org</a> or message a moderator
                    on <a href="https://discord.gg/ckQ52gA" target="_blank" rel="noopener noreferrer" className={linkClass}>Discord</a>.
                    A screenshot and a link to where it happened help us act quickly. We keep reports private.
                </p>
                <p>
                    The team will take whatever action it thinks is right, from a warning to removing content or banning
                    someone from w3Develops. Breaking this code also breaks our{' '}
                    <Link href="/terms" className={linkClass}>Terms of Use</Link>.
                </p>
            </LegalSection>
        </LegalPage>
    );
}
