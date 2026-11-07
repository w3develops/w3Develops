import type { Metadata } from 'next';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { LegalPage, LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
    title: 'Cookies | w3Develops',
    description: 'The few cookies and browser storage w3Develops uses, what each one is for, and how to turn them off.',
};

const linkClass = 'text-primary underline';

const storage = [
    {
        name: 'Firebase sign-in',
        where: 'Browser storage (IndexedDB)',
        why: 'Keeps you signed in as you move between pages.',
        howLong: 'Until you sign out',
        needed: 'Yes',
    },
    {
        name: '_ga, _ga_*',
        where: 'Cookie, set by Google Analytics',
        why: 'Counts visits and shows which pages are popular, without telling us who you are.',
        howLong: 'Up to 2 years',
        needed: 'No',
    },
    {
        name: 'Firebase installation ID',
        where: 'Browser storage (IndexedDB)',
        why: 'Lets Google Analytics count a returning browser once instead of twice.',
        howLong: 'Until you clear site data',
        needed: 'No',
    },
];

export default function CookiesPage() {
    return (
        <LegalPage
            icon={<Cookie className="h-10 w-10" />}
            title="Cookies"
            lastUpdated="November 2, 2026"
            intro={
                <p>
                    We use a small amount of browser storage to keep you signed in, and Google Analytics to count visits. That's
                    it. There are no advertising cookies, no social media trackers, and nothing that follows you around the web.
                </p>
            }
        >
            <LegalSection
                title="What cookies are"
                summary="Small bits of information a website saves in your browser."
            >
                <p>
                    Cookies and similar browser storage let a site remember things between page loads, like the fact that you're
                    signed in. Some are needed for a site to work. Others are optional, like the ones used to count visitors.
                </p>
            </LegalSection>

            <LegalSection title="What we use">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="py-2 pr-4 font-semibold">Name</th>
                                <th className="py-2 pr-4 font-semibold">What it's for</th>
                                <th className="py-2 pr-4 font-semibold">How long</th>
                                <th className="py-2 font-semibold">Needed?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {storage.map(item => (
                                <tr key={item.name} className="border-b align-top">
                                    <td className="py-3 pr-4">
                                        <span className="font-mono">{item.name}</span>
                                        <span className="block text-muted-foreground">{item.where}</span>
                                    </td>
                                    <td className="py-3 pr-4">{item.why}</td>
                                    <td className="py-3 pr-4">{item.howLong}</td>
                                    <td className="py-3">{item.needed}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p>
                    Google Analytics tells us things like how many people visited a page, roughly which country they came from,
                    and what kind of device they used. We don't use it for ads, and we don't connect it to your w3Develops account.
                </p>
            </LegalSection>

            <LegalSection
                title="Turning them off"
                summary="Block the optional ones and the site still works. Block the sign-in storage and you'll just need to sign in again."
            >
                <p>
                    You can block or delete cookies and site data in your browser's settings, or use a content blocker. Blocking
                    Google Analytics won't change anything about how w3Develops works for you. If you block all site storage,
                    you won't be able to stay signed in.
                </p>
            </LegalSection>

            <LegalSection title="Changes and questions">
                <p>
                    If we add or remove anything on this list, we'll update this page and change the date at the top. Our{' '}
                    <Link href="/privacy" className={linkClass}>Privacy Policy</Link> covers everything else about your
                    information. Questions? Email{' '}
                    <a href="mailto:privacy@w3develops.org" className={linkClass}>privacy@w3develops.org</a>.
                </p>
            </LegalSection>
        </LegalPage>
    );
}
