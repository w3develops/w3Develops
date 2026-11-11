import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { pageMetadata } from '@/lib/site-pages';

export const metadata: Metadata = pageMetadata('/privacy');

const linkClass = 'text-primary underline';

export default function PrivacyPage() {
    return (
        <LegalPage
            icon={<ShieldCheck className="h-10 w-10" />}
            title="Privacy Policy"
            lastUpdated="November 7, 2026"
            intro={
                <>
                    <p>
                        w3Develops is a free, volunteer-run community for people learning to code. We collect what we need to run
                        study groups, projects and profiles, and not much else. We don't sell your information, we don't run ads,
                        and we don't share your data with data brokers.
                    </p>
                    <p>This page explains exactly what we collect and what you can do about it.</p>
                </>
            }
        >
            <LegalSection
                title="What we collect"
                summary="Your email, a username and your timezone to make an account. Anything else on your profile is up to you."
            >
                <ul className="list-disc pl-6 space-y-2">
                    <li>
                        <strong>Your account.</strong> Your email address, username, password and timezone. Passwords are handled
                        by Firebase Authentication, and we never see them in plain text. We ask for your timezone so groups can
                        find meeting times that work.
                    </li>
                    <li>
                        <strong>Your profile, if you fill it in.</strong> A profile picture link, bio, skills, and links to your
                        GitHub, LinkedIn or X accounts.
                    </li>
                    <li>
                        <strong>What you do in the community.</strong> The study groups, projects, book clubs and meetups you
                        create or join; who you follow; check-ins and status updates; mentorship, tutoring and pair programming
                        requests; and notes, tasks and messages you post in those spaces.
                    </li>
                    <li>
                        <strong>Direct messages and your birth date, if you use messages.</strong> Messages are for members 18
                        and over, so we ask for your birth date once. Only you can see it, and it&apos;s used only to check your
                        age. Your messages are seen only by you and the person you&apos;re writing to; if one of you reports a
                        message, a copy of that one message goes to our moderators.
                    </li>
                    <li>
                        <strong>Things you send us.</strong> Feedback, support requests and job applications. Applications include
                        your name, email, résumé and portfolio links, and cover letter.
                    </li>
                    <li>
                        <strong>Basic technical information.</strong> Like almost every website, our hosting keeps short-lived
                        server logs (such as IP address and browser type) so we can keep the site secure and fix bugs. We also use
                        Google Analytics to count visits. See <Link href="/cookies" className={linkClass}>our cookie page</Link> for
                        details.
                    </li>
                </ul>
            </LegalSection>

            <LegalSection
                title="What other members can see"
                summary="Your profile and community activity are public. Your email address is not."
            >
                <p>
                    w3Develops is a community, so most of what you share is meant to be seen: your username, profile, the groups
                    and projects you're part of, and who you follow. Like a GitHub profile, a profile with a bio or skills can
                    show up in search engines such as Google. You can hide your follower and following lists when you
                    edit your profile. Your email address and anything you send us directly (feedback, support requests, applications)
                    are never shown to other members.
                </p>
                <p>
                    Spaces like mentorships, tutoring sessions and pairings are visible only to the people in them.
                </p>
            </LegalSection>

            <LegalSection
                title="How we use it"
                summary="To run the site, keep it safe, and send you emails you've asked for."
            >
                <ul className="list-disc pl-6 space-y-2">
                    <li>To run your account and the community features you use.</li>
                    <li>To match people for groups, mentorships, tutoring and pair programming.</li>
                    <li>To send newsletters and notifications you've turned on. You can turn them off at any time in your settings.</li>
                    <li>To reply when you contact us, and to review job applications.</li>
                    <li>To keep the site secure, stop spam and abuse, and fix problems.</li>
                    <li>To understand which parts of the site people use, so we know what to improve.</li>
                </ul>
                <p>We don't use your information for advertising, and we don't build profiles of you to sell to anyone.</p>
            </LegalSection>

            <LegalSection
                title="Who we share it with"
                summary="Only the services that keep the site running, and only when the law truly requires it."
            >
                <ul className="list-disc pl-6 space-y-2">
                    <li>
                        <strong>Google Firebase and Google Cloud</strong> host the site and store our database, and handle sign-in
                        and analytics. Your data is stored on Google's servers in the United States.
                    </li>
                    <li>
                        <strong>TypeSafe</strong> helps sort the public tech headlines in our daily news brief. It only ever sees
                        public news headlines, never anything about you.
                    </li>
                    <li>
                        <strong>Legal requests.</strong> We will only hand over information when a valid legal process requires it.
                        When the law allows, we'll tell you first so you can respond. Our{' '}
                        <Link href="/warrant-canary" className={linkClass}>warrant canary</Link> has more on this.
                    </li>
                    <li>
                        <strong>Safety.</strong> If someone is in danger of serious harm, we may share what's needed to prevent it.
                    </li>
                </ul>
                <p>
                    If w3Develops ever joins or is handed over to another organization, this policy will still apply to the
                    information we already hold, and we'll tell you before anything changes.
                </p>
            </LegalSection>

            <LegalSection
                title="Your choices"
                summary="You can see, fix, download or delete your information. Just ask."
            >
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Change it:</strong> edit your profile and notification settings at any time.</li>
                    <li>
                        <strong>Get a copy:</strong> use <em>Download My Data</em> on the{' '}
                        <Link href="/security" className={linkClass}>Security page</Link>, or email us and we'll send it to you.
                    </li>
                    <li>
                        <strong>Delete it:</strong> use <em>Delete My Account</em> on the Security page, or email us and we'll
                        do it for you. Things you posted in shared spaces, like group project tasks, may be kept without your name so the
                        group's work still makes sense.
                    </li>
                    <li>
                        <strong>Opt out of analytics:</strong> block analytics in your browser or with a content blocker. The site
                        works the same without it.
                    </li>
                </ul>
                <p>
                    We'll answer these requests within 30 days, whatever country you live in. You don't need to give a reason.
                </p>
            </LegalSection>

            <LegalSection title="How long we keep it">
                <p>
                    We keep your account information for as long as you have an account. Feedback and support requests are kept
                    for as long as they're useful for fixing the problem. Job applications are kept for up to a year. Server logs
                    are deleted automatically, usually within 30 days. Once you delete your account, it may take up to 30 days
                    for it to disappear from our backups.
                </p>
            </LegalSection>

            <LegalSection title="Kids">
                <p>
                    You need to be at least 13 years old to make an account. If you think a child under 13 has signed up, let us
                    know and we'll delete the account.
                </p>
            </LegalSection>

            <LegalSection title="Changes to this policy">
                <p>
                    If we change how we handle your information, we'll update this page and change the date at the top. For
                    bigger changes, we'll let members know on the site or by email before they take effect. Our code is open source,
                    so you can also see every past version of this page{' '}
                    <a href="https://github.com/JonDevOps/w3Develops/commits/main/src/app/privacy/page.tsx" className={linkClass}>on GitHub</a>.
                </p>
            </LegalSection>

            <LegalSection title="Questions">
                <p>
                    For anything privacy-related, email{' '}
                    <a href="mailto:privacy@w3develops.org" className={linkClass}>privacy@w3develops.org</a>. A real person will
                    read it.
                </p>
            </LegalSection>
        </LegalPage>
    );
}
