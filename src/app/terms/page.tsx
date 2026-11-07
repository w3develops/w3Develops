import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale } from 'lucide-react';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { pageMetadata } from '@/lib/site-pages';

export const metadata: Metadata = pageMetadata('/terms');

const linkClass = 'text-primary underline';

export default function TermsPage() {
    return (
        <LegalPage
            icon={<Scale className="h-10 w-10" />}
            title="Terms of Use"
            lastUpdated="November 2, 2026"
            intro={
                <>
                    <p>
                        w3Develops is a free community where developers learn, build and team up. These terms are the ground rules
                        that keep it working. We've tried to keep them short and readable.
                    </p>
                    <p>
                        By using w3Develops you agree to these terms and to our{' '}
                        <Link href="/privacy" className={linkClass}>Privacy Policy</Link>.
                    </p>
                </>
            }
        >
            <LegalSection
                title="Your account"
                summary="You need to be 13 or older. Use a real email address and keep your password to yourself."
            >
                <p>
                    You need to be at least 13 years old to make an account. Please use an email address you can access, keep
                    your password safe, and let us know if you think someone else is using your account. You're responsible for
                    what happens on your account, so don't share it.
                </p>
            </LegalSection>

            <LegalSection
                title="Be a good community member"
                summary="Treat people with respect and help each other learn."
            >
                <p>People here are at every level, from writing their first line of code to leading teams. Please don't:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Harass, threaten, bully or discriminate against anyone.</li>
                    <li>Share someone's private information without their permission.</li>
                    <li>Post spam, scams, malware, or anything illegal.</li>
                    <li>Pretend to be someone you're not.</li>
                    <li>Post other people's work as your own, or share content you don't have the right to share.</li>
                    <li>Try to break into accounts, or disrupt the site for others.</li>
                </ul>
                <p>
                    If someone breaks these rules, we may remove their content or suspend their account. We'll try to explain
                    why, and if you think we got it wrong, email us and we'll take another look.
                </p>
            </LegalSection>

            <LegalSection
                title="Your work is yours"
                summary="You keep ownership of everything you create here. You just give us permission to show it on the site."
            >
                <p>
                    You own the code, writing and projects you share on w3Develops. By posting them, you give us permission to
                    store and display them on w3Develops so the community can see them and work with you. That permission ends
                    when you delete your content or your account, except for copies other people have already made under an open
                    license you chose.
                </p>
                <p>
                    We encourage you to share your work under an open source or Creative Commons license so others can learn
                    from it. Group projects follow whatever license the group picks.
                </p>
            </LegalSection>

            <LegalSection
                title="Building on w3Develops"
                summary="You're welcome to build tools, bots and scripts that work with the site. Just don't overload it or misuse people's data."
            >
                <p>
                    You're free to build your own tools that work with your own data or public community content, including
                    apps, bots, browser extensions and scrapers. Please keep them polite: don't overload the site, don't get
                    around privacy settings, and don't collect members' information to spam or track them. We won't use legal
                    threats to stop people building tools that help others learn, or that help them take their data elsewhere.
                </p>
                <p>
                    The w3Develops code is{' '}
                    <a href="https://github.com/JonDevOps/w3Develops" className={linkClass}>open source on GitHub</a> under the BSD 3-Clause license, and
                    contributions are welcome. The w3Develops name and logo are ours, so please don't use them in a way that
                    suggests we endorse something we don't.
                </p>
            </LegalSection>

            <LegalSection
                title="Other websites and donations"
                summary="Links to other sites and donation platforms follow those sites' own rules."
            >
                <p>
                    w3Develops links to many outside resources, like news articles, job listings, tutorials and meetups we don't
                    run. We aren't responsible for what's on those sites. Donations go through Open Collective, Patreon or PayPal
                    under their terms. If you donated by mistake, email us and we'll do our best to help.
                </p>
            </LegalSection>

            <LegalSection
                title="The fine print"
                summary="w3Develops is free and run by volunteers, so we can't promise it will always be perfect."
            >
                <p>
                    We work hard to keep w3Develops running smoothly, but we provide it "as is," without guarantees that it will
                    always be available or error-free. Advice, code and opinions shared by members are their own, so use your own
                    judgment before relying on them. To the extent the law allows, w3Develops and its volunteers aren't liable
                    for indirect losses that come from using the site. Nothing in these terms takes away rights you have under
                    the consumer protection laws where you live.
                </p>
            </LegalSection>

            <LegalSection
                title="If we disagree"
                summary="Let's talk first. If that doesn't work, you keep your right to go to court."
            >
                <p>
                    If you have a problem with w3Develops, please email us first. Most things can be sorted out with a
                    conversation. If they can't, you keep every right you have to take the matter to court, including joining a
                    class action. We don't use forced arbitration.
                </p>
            </LegalSection>

            <LegalSection
                title="Leaving, and changes to these terms"
                summary="You can leave whenever you like. If we change these terms, we'll tell you."
            >
                <p>
                    You can stop using w3Develops at any time, and you can delete your account yourself from the{' '}
                    <Link href="/security" className={linkClass}>Security page</Link>. If we ever have to shut the site down,
                    we'll give members advance notice and a chance to download their data.
                </p>
                <p>
                    If we change these terms, we'll update this page and the date at the top, and let members know about
                    bigger changes before they take effect. You can see every past version{' '}
                    <a href="https://github.com/JonDevOps/w3Develops/commits/main/src/app/terms/page.tsx" className={linkClass}>on GitHub</a>.
                </p>
            </LegalSection>

            <LegalSection title="Questions">
                <p>
                    Email <a href="mailto:legal@w3develops.org" className={linkClass}>legal@w3develops.org</a> with any
                    questions about these terms.
                </p>
            </LegalSection>
        </LegalPage>
    );
}
