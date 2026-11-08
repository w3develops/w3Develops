
import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/header";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import Footer from "@/components/layout/footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { HOME_DESCRIPTION, HOME_TITLE, SITE_NAME, SITE_URL, sharePreview } from "@/lib/site-pages";
import JsonLd from "@/components/JsonLd";
import ErrorReporter from "@/components/ErrorReporter";


const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-headline',
});

// Pages set their own title and description from src/lib/site-pages.ts;
// a page title like "Meetups" is shown as "Meetups | w3Develops"
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: HOME_TITLE, template: `%s | ${SITE_NAME}` },
  description: HOME_DESCRIPTION,
  // Pages without their own preview use the site's
  ...sharePreview(HOME_TITLE, HOME_DESCRIPTION, '/'),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', rel: 'icon', type: 'image/x-icon', sizes: 'any' },
      { url: '/android-icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/apple-icon-57x57.png', sizes: '57x57' },
      { url: '/apple-icon-60x60.png', sizes: '60x60' },
      { url: '/apple-icon-72x72.png', sizes: '72x72' },
      { url: '/apple-icon-76x76.png', sizes: '76x76' },
      { url: '/apple-icon-114x114.png', sizes: '114x114' },
      { url: '/apple-icon-120x120.png', sizes: '120x120' },
      { url: '/apple-icon-144x144.png', sizes: '144x144' },
      { url: '/apple-icon-152x152.png', sizes: '152x152' },
      { url: '/apple-icon-180x180.png', sizes: '180x180' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
}

// Tells search engines and AI tools who runs the site, where else to find
// w3Develops, and how to search it
const SITE_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description: HOME_DESCRIPTION,
      sameAs: [
        'https://github.com/w3develops',
        'https://x.com/w3develops',
        'https://www.youtube.com/w3Develops',
        'https://www.linkedin.com/company/w3develops',
        'https://www.reddit.com/r/w3Develops/',
        'https://www.instagram.com/w3develops/',
        'https://www.facebook.com/groups/w3develops/',
        'https://mastodon.social/@w3develops',
        'https://bsky.app/profile/w3develops.bsky.social',
        'https://discord.gg/ckQ52gA',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased flex flex-col",
          inter.variable,
          spaceGrotesk.variable
        )}
      >
        <JsonLd data={SITE_STRUCTURED_DATA} />
        {/* React moves this into the page head: lets feed readers find /feed.xml */}
        <link rel="alternate" type="application/rss+xml" title={`What's new on ${SITE_NAME}`} href="/feed.xml" />
        <ErrorReporter />
        <FirebaseClientProvider>
            <AnnouncementBanner />
            <Header />
            <EmailVerificationBanner />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
