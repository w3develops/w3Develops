'use client';

import { Github, Youtube, Facebook, Instagram, Linkedin, Rss, Twitter, Podcast } from 'lucide-react';
import Link from 'next/link';

// SVGs for icons not available in Lucide
const DiscordIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className="h-6 w-6">
    <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4464.8245-.6667 1.2835-2.083-0.2874-4.2238-0.2874-6.3067 0-.2203-.459-.4557-.9082-.6667-1.2835a.077.077 0 0 0-.0785-.0371 19.7363 19.7363 0 0 0-4.8851 1.5152.069.069 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.5767.8851-1.1916 1.29-1.854a.0722.0722 0 0 0-.028-.0943c-.5843-.2956-1.1498-.6351-1.6853-1.0176a.0744.0744 0 0 1 .0015-.1186c.1348-.1044.2717-.2088.406-.3154a.0779.0779 0 0 1 .099-.0057c.9737.6159 2.0318 1.1512 3.1373 1.5729a.0759.0759 0 0 0 .0879-.0023c1.1055-.4217 2.1636-.957 3.1373-1.5729a.0779.0779 0 0 1 .099.0057c.1343.1066.2712.211.406.3154a.0744.0744 0 0 1 .0015.1186c-.5355.3825-1.101.722-1.6853 1.0176a.0722.0722 0 0 0-.028.0943c.4048.6624.8283 1.2773 1.29 1.854a.0777.0777 0 0 0 .0842.0276c1.9516-.6067 3.9401-1.5219 5.9929-3.0294a.0824.0824 0 0 0 .0312-.0561c.4182-4.4779-.4337-9.012-.9581-13.6602a.069.069 0 0 0-.0321-.0277zM8.02 15.3312c-.9416 0-1.7041-1.0125-1.7041-2.2625s.7625-2.2625 1.7041-2.2625c.9416 0 1.7041 1.0125 1.7041 2.2625s-.7625 2.2625-1.7041 2.2625zm7.9599 0c-.9416 0-1.7041-1.0125-1.7041-2.2625s.7625-2.2625 1.7041-2.2625c.9416 0 1.7041 1.0125 1.7041 2.2625s-.7625 2.2625-1.7041 2.2625z"/>
  </svg>
);

const MediumIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className="h-6 w-6">
    <path d="M7.45 18.23a.6.6 0 0 1-.4-.14L.88 12.3a.6.6 0 0 1 0-.91l6.17-5.79a.6.6 0 0 1 .8.9L2.4 12l5.45 5.2a.6.6 0 0 1-.4 1.03zm5.72 0a.6.6 0 0 1-.4-.14L7.54 12.3a.6.6 0 0 1 0-.91l5.23-5.79a.6.6 0 0 1 .8.9L8.83 12l4.9 5.2a.6.6 0 0 1-.4 1.03zm5.1-5.32a3.8 3.8 0 0 1-3.79 3.79A3.8 3.8 0 0 1 14.7 13a3.8 3.8 0 0 1 3.78-3.79A3.8 3.8 0 0 1 22.25 13a3.8 3.8 0 0 1-3.78 3.79h-.2a3.5 3.5 0 0 1-3.23-3.23c0-1.6 1.3-2.9 2.9-2.9h.2a2.9 2.9 0 0 1 2.9 2.9z"/>
  </svg>
);

const RedditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" className="h-6 w-6">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.1 11.4c-.4.4-1.1.4-1.5 0l-.8-.8c-.1-.1-.3-.1-.4 0l-.8.8c-.4.4-1.1.4-1.5 0-.4-.4-.4-1.1 0-1.5l.8-.8c.1-.1.1-.3 0-.4l-.8-.8c-.4-.4-.4-1.1 0-1.5.4-.4 1.1-.4 1.5 0l.8.8c.1.1.3.1.4 0l.8-.8c.4-.4 1.1-.4 1.5 0 .4.4.4 1.1 0 1.5l-.8.8c-.1.1-.1.3 0 .4l.8.8c.4.4.4 1.1 0 1.5M4.4 6c0-.5.4-.9.9-.9s.9.4.9.9-.4.9-.9.9-.9-.4-.9-.9m6.3 0c0-.5.4-.9.9-.9s.9.4.9.9-.4.9-.9.9-.9-.4-.9-.9m-3.1 4.3c-1.3 0-2.3 1-2.3 2.3h4.6c0-1.3-1-2.3-2.3-2.3" />
    </svg>
);


const MastodonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className="h-6 w-6">
        <path d="M23.19,9.52c0-2.26-1.57-4.14-3.67-4.14H17.4c-0.84,0-1.58,0.48-1.95,1.23c-0.63,1.27-1.2,2.57-1.7,3.89c-0.42-0.2-0.86-0.38-1.32-0.52c-0.78-0.25-1.57-0.4-2.38-0.4c-3.95,0-7.16,3.2-7.16,7.16c0,1.38,0.4,2.67,1.09,3.77C4.7,21.68,5.82,22.03,7,22c0.88-0.02,1.72-0.34,2.44-0.9c0.58-0.45,1.07-1,1.45-1.63c0.37-0.62,0.6-1.3,0.68-2.02c0.14-1.27,0.22-2.56,0.22-3.86c0-0.6-0.03-1.2-0.08-1.79c0.69,0.25,1.38,0.52,2.05,0.82c0.91,0.4,1.78,0.85,2.59,1.34c0.8,0.48,1.52,0.99,2.15,1.53c0.8,0.67,1.4,1.48,1.77,2.39c0.11,0.28,0.21,0.57,0.3,0.86c0.09,0.3,0.16,0.6,0.22,0.9c0.07,0.37,0.11,0.74,0.11,1.12c0,0.18-0.01,0.36-0.02,0.54c-0.03,0.34-0.07,0.68-0.12,1.01c-0.05,0.34-0.11,0.68-0.18,1.01c-0.24,1.15-0.74,2.2-1.44,3.1c-0.75,0.96-1.72,1.74-2.82,2.28c-1.12,0.55-2.34,0.83-3.6,0.83c-2.45,0-4.71-0.93-6.42-2.58C2.93,19.33,2,16.8,2,14.07c0-4.99,4.04-9.03,9.03-9.03c1.3,0,2.55,0.28,3.69,0.8c1.1,0.49,2.1,1.15,2.99,1.95l0.12,0.1c0.13,0.12,0.25,0.23,0.37,0.35c0.12,0.12,0.23,0.23,0.34,0.35c0.85,0.9,1.52,1.93,1.98,3.03c0.47,1.12,0.7,2.33,0.7,3.58c0,0.52-0.06,1.03-0.17,1.53c-0.12,0.5-0.28,0.99-0.48,1.45c-0.2,0.47-0.44,0.92-0.71,1.35c-0.56,0.88-1.33,1.6-2.25,2.1c-0.9,0.5-1.92,0.78-2.98,0.78c-2.1,0-4.04-0.81-5.5-2.27c-1.46-1.46-2.27-3.4-2.27-5.5c0-1.89,0.76-3.6,2.01-4.85c1.25-1.25,2.96-2.01,4.85-2.01c0.7,0,1.38,0.1,2.04,0.29c0.65,0.19,1.29,0.44,1.9,0.73l0.36,0.17c0.23,0.11,0.46,0.22,0.68,0.33l-0.8-4.22c-0.06-0.34-0.14-0.67-0.24-0.99c-0.1-0.32-0.22-0.64-0.35-0.95C17.06,6.33,16.29,5.77,15.42,5.77h-2.1c-0.41,0-0.75,0.34-0.75,0.75s0.34,0.75,0.75,0.75h2.1c0.3,0,0.57,0.17,0.71,0.43c0.14,0.26,0.18,0.56,0.13,0.85l1.03,5.43c-0.74-0.48-1.53-0.92-2.36-1.3c-0.84-0.38-1.7-0.72-2.59-0.99c-1.41-0.43-2.88-0.65-4.38-0.65C6.83,12.8,3,16.63,3,21.32c0,1.52,0.41,2.94,1.13,4.17c0.72,1.23,1.75,2.25,2.98,2.98c1.23,0.72,2.65,1.13,4.17,1.13c1.55,0,3-0.42,4.28-1.18c1.29-0.77,2.37-1.85,3.14-3.14c0.77-1.29,1.18-2.73,1.18-4.28c0-1.49-0.38-2.88-1.05-4.1c-0.67-1.22-1.61-2.25-2.75-3.03c-1.14-0.78-2.45-1.32-3.85-1.57c-0.2-0.04-0.4-0.07-0.6-0.1c-0.68-0.1-1.37-0.15-2.07-0.15c-3.31,0-6,2.69-6,6s2.69,6,6,6c1.66,0,3.16-0.67,4.24-1.76c1.08-1.08,1.76-2.58,1.76-4.24c0-0.66-0.11-1.3-0.31-1.9c-0.2-0.6-0.5-1.16-0.87-1.67c-0.37-0.51-0.82-0.96-1.32-1.32c-0.5-0.37-1.05-0.66-1.63-0.86c-0.58-0.2-1.19-0.3-1.81-0.3c-1.1,0-2.1,0.45-2.83,1.17c-0.73,0.73-1.17,1.72-1.17,2.83c0,0.41-0.34,0.75-0.75,0.75s-0.75-0.34-0.75-0.75c0-1.55,0.63-2.97,1.76-4.1c1.13-1.13,2.64-1.76,4.24-1.76c0.77,0,1.52,0.15,2.23,0.43c0.71,0.28,1.39,0.66,2.03,1.11c0.64,0.45,1.23,0.99,1.73,1.59c0.5,0.6,0.91,1.25,1.2,1.94c0.29,0.69,0.44,1.42,0.44,2.17c0,2.21-0.89,4.21-2.34,5.66c-1.45,1.45-3.45,2.34-5.66,2.34c-2.21,0-4.21-0.89-5.66-2.34c-1.45-1.45-2.34-3.45-2.34-5.66c0-4.41,3.58-8,8-8c1.7,0,3.3,0.54,4.65,1.48L23.19,9.52z"/>
    </svg>
);

const BlueskyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className="h-6 w-6">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.44 14.54c-1.18.66-2.58.98-4.08.92-2.1-.08-4.04-.9-5.46-2.32-1.42-1.42-2.24-3.36-2.32-5.46-.06-1.5.26-2.9.92-4.08C5.22 4.4 6.42 3.5 7.8 3.02c1.7-.58 3.54-.6 5.32-.04 1.78.56 3.3 1.62 4.3 3.08.82 1.2.9 2.5.88 3.84-.02.76-.18 1.5-4.3 3.58-1.16.58-2.36.9-3.58.9s-2.42-.32-3.58-.9c-1.16-.58-2.36-.9-3.58-.9-.16 0-.32.02-.48.04.18 2.38 1.2 4.54 2.86 5.92 1.66 1.38 3.78 2.06 5.92 2.02 1.72-.04 3.36-.54 4.7-1.44.1-.06.2-.14.28-.22.8-1.22 1.1-2.64.92-4.08-.02-.16-.04-.32-.06-.48.22.14.44.28.66.42 1.24.78 2.52 1.18 3.84 1.18.52 0 1.02-.08 1.5-.24-.44 1.74-1.5 3.26-3.06 4.3z"/>
    </svg>
);

export default function Footer() {
  const primarySocials = (
    <>
      <a href="https://github.com/w3develops/w3develops" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <Github />
      </a>
      <a href="https://x.com/w3develops" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <Twitter />
      </a>
      <a href="https://www.youtube.com/w3Develops?sub_confirmation=1" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <Youtube />
      </a>
      <a href="https://www.facebook.com/groups/w3develops/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <Facebook />
      </a>
      <a href="https://discord.gg/ckQ52gA" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <DiscordIcon />
      </a>
      <a href="https://mastodon.social/@w3develops" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <MastodonIcon />
      </a>
    </>
  );

  const secondarySocials = (
    <>
      <a href="https://bsky.app/profile/w3develops.bsky.social" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <BlueskyIcon />
      </a>
      <a href="https://www.instagram.com/w3develops/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <Instagram />
      </a>
      <a href="https://medium.com/w3develops" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <MediumIcon />
      </a>
      <a href="https://www.linkedin.com/company/w3develops" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <Linkedin />
      </a>
      <a href="https://www.reddit.com/r/w3Develops/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <RedditIcon />
      </a>
      <a href="https://www.youtube.com/watch?v=VLZhlngst2E&list=PLTwiqKOPckq-z5E-LUpMXpcv_GWXE2k4F" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary">
        <Podcast />
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
