
'use client';

import { Github, Youtube, Facebook, Instagram, Linkedin, Rss } from 'lucide-react';
import { FaDiscord, FaMedium, FaReddit, FaPodcast, FaXTwitter, FaMastodon, FaBluesky } from 'react-icons/fa6';
import Link from 'next/link';

export default function Footer() {
  const primarySocials = (
    <>
      <a href="https://github.com/w3develops/w3develops" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <Github />
      </a>
      <a href="https://x.com/w3develops" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <FaXTwitter size={24} />
      </a>
      <a href="https://www.youtube.com/w3Develops?sub_confirmation=1" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <Youtube />
      </a>
      <a href="https://www.facebook.com/groups/w3develops/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <Facebook />
      </a>
      <a href="https://discord.gg/ckQ52gA" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <FaDiscord size={24} />
      </a>
      <a href="https://mastodon.social/@w3develops" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <FaMastodon size={24} />
      </a>
    </>
  );

  const secondarySocials = (
    <>
      <a href="https://bsky.app/profile/w3develops.bsky.social" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <FaBluesky size={24} />
      </a>
      <a href="https://www.instagram.com/w3develops/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <Instagram />
      </a>
      <a href="https://medium.com/w3develops" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <FaMedium size={24} />
      </a>
      <a href="https://www.linkedin.com/company/w3develops" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <Linkedin />
      </a>
      <a href="https://www.reddit.com/r/w3Develops/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <FaReddit size={24} />
      </a>
      <a href="https://www.youtube.com/watch?v=VLZhlngst2E&list=PLTwiqKOPckq-z5E-LUpMXpcv_GWXE2k4F" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <FaPodcast size={24} />
      </a>
    </>
  );

  return (
    <footer className="bg-[#212529] border-t border-border/5 py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Layout */}
        <div className="flex flex-col items-center gap-6 md:hidden">
          <div className="flex justify-center gap-5">
            {primarySocials}
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Made with ❤️ for a better web</p>
            <div className="flex justify-center gap-4 text-sm mt-2 flex-wrap">
              <Link href="/privacy" className="text-primary hover:text-primary/80">Privacy Policy</Link>
              <Link href="/terms" className="text-primary hover:text-primary/80">Terms of Use</Link>
              <Link href="/cookies" className="text-primary hover:text-primary/80">Cookies</Link>
              <Link href="/newsletter" className="text-primary hover:text-primary/80">Newsletter</Link>
              <Link href="/donate" className="text-primary hover:text-primary/80">Donate</Link>
              <Link href="/marketplace" className="text-primary hover:text-primary/80">Marketplace</Link>
              <Link href="/feedback" className="text-primary hover:text-primary/80">Feedback</Link>
              <Link href="/support" className="text-primary hover:text-primary/80">Support</Link>
              <Link href="/contribute" className="text-primary hover:text-primary/80">Contribute</Link>
              <Link href="/faq" className="text-primary hover:text-primary/80">FAQ</Link>
            </div>
          </div>
          <div className="flex justify-center gap-5">
            {secondarySocials}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-8 md:items-center">
          <div className="flex justify-start gap-5">
            {primarySocials}
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Made with ❤️ for a better web</p>
            <div className="flex justify-center gap-4 text-sm mt-2 flex-wrap">
              <Link href="/privacy" className="text-primary hover:text-primary/80">Privacy Policy</Link>
              <Link href="/terms" className="text-primary hover:text-primary/80">Terms of Use</Link>
              <Link href="/cookies" className="text-primary hover:text-primary/80">Cookies</Link>
              <Link href="/newsletter" className="text-primary hover:text-primary/80">Newsletter</Link>
              <Link href="/donate" className="text-primary hover:text-primary/80">Donate</Link>
              <Link href="/marketplace" className="text-primary hover:text-primary/80">Marketplace</Link>
              <Link href="/feedback" className="text-primary hover:text-primary/80">Feedback</Link>
              <Link href="/support" className="text-primary hover:text-primary/80">Support</Link>
              <Link href="/contribute" className="text-primary hover:text-primary/80">Contribute</Link>
              <Link href="/faq" className="text-primary hover:text-primary/80">FAQ</Link>
            </div>
          </div>
          <div className="flex justify-end gap-5">
            {secondarySocials}
          </div>
        </div>
      </div>
    </footer>
  );
}
