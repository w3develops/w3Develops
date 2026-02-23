
'use client';

import { Github, Youtube, Facebook, Instagram, Linkedin, Twitter, Podcast } from 'lucide-react';
import Link from 'next/link';

// Corrected SVGs for icons not available in Lucide, ensuring centering and brand accuracy
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4464.8245-.6667 1.2835-2.083-0.2874-4.2238-0.2874-6.3067 0-.2203-.459-.4557-.9082-.6667-1.2835a.077.077 0 0 0-.0785-.0371 19.7363 19.7363 0 0 0-4.8851 1.5152.069.069 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.5767.8851-1.1916 1.29-1.854a.0722.0722 0 0 0-.028-.0943c-.5843-.2956-1.1498-.6351-1.6853-1.0176a.0744.0744 0 0 1 .0015-.1186c.1348-.1044.2717-.2088.406-.3154a.0779.0779 0 0 1 .099-.0057c.9737.6159 2.0318 1.1512 3.1373 1.5729a.0759.0759 0 0 0 .0879-.0023c1.1055-.4217 2.1636-.957 3.1373-1.5729a.0779.0779 0 0 1 .099.0057c.1343.1066.2712.211.406.3154a.0744.0744 0 0 1 .0015.1186c-.5355.3825-1.101.722-1.6853 1.0176a.0722.0722 0 0 0-.028.0943c.4048.6624.8283 1.2773 1.29 1.854a.0777.0777 0 0 0 .0842.0276c1.9516-.6067 3.9401-1.5219 5.9929-3.0294a.0824.0824 0 0 0 .0312-.0561c.4182-4.4779-.4337-9.012-.9581-13.6602a.069.069 0 0 0-.0321-.0277zM8.02 15.3312c-.9416 0-1.7041-1.0125-1.7041-2.2625s.7625-2.2625 1.7041-2.2625c.9416 0 1.7041 1.0125 1.7041 2.2625s-.7625 2.2625-1.7041 2.2625zm7.9599 0c-.9416 0-1.7041-1.0125-1.7041-2.2625s.7625-2.2625 1.7041-2.2625c.9416 0 1.7041 1.0125 1.7041 2.2625s-.7625 2.2625-1.7041 2.2625z"/>
  </svg>
);

const MediumIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13.54 12a6.8 6.8 0 11-6.77-6.82A6.77 6.77 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42S14.2 15.54 14.2 12s1.51-6.42 3.38-6.42 3.38 2.88 3.38 6.42zM24 12c0 3.17-.53 5.75-1.19 5.75s-1.19-2.58-1.19-5.75.53-5.75 1.19-5.75S24 8.83 24 12z"/>
  </svg>
);

const RedditIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 11.5c0-1.65-1.35-3-3-3-.4 0-.78.08-1.13.24-1.64-1.24-3.86-2.03-6.29-2.13l1.08-5.11 3.53.75c.05 1 .9 1.8 1.93 1.8 1.07 0 1.93-.88 1.93-1.97S21.2 0 20.13 0c-.83 0-1.54.54-1.81 1.29l-3.97-.85c-.11-.02-.22.01-.3.09-.09.07-.13.18-.11.29l-1.2 5.62c-2.48.01-4.77.8-6.47 2.06-.35-.16-.73-.24-1.13-.24-1.65 0-3 1.35-3 3 0 1.05.54 1.98 1.35 2.52-.03.16-.05.33-.05.5 0 3.59 4.03 6.5 9 6.5s9-2.91 9-6.5c0-.17-.02-.34-.05-.5.81-.54 1.35-1.47 1.35-2.52zM7.03 13.5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9.15 4.66c-1.11 1.11-3.2 1.19-4.18 1.19s-3.07-.08-4.18-1.19c-.15-.15-.15-.4 0-.55.15-.15.4-.15.55 0 .82.81 2.51.94 3.63.94s2.81-.13 3.63-.94c.15-.15.4-.15.55 0 .15.15.15.41 0 .55zM14.97 15.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>
);

const MastodonIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.193 7.879c0-5.206-3.411-6.732-3.411-6.732C18.062.357 15.108.025 12.041 0h-.076c-3.068.025-6.02.357-7.74 1.147 0 0-3.411 1.526-3.411 6.732 0 1.192-.023 2.618.015 4.129.124 5.092.934 10.109 5.641 11.355 2.17.574 4.034.694 5.535.612 2.722-.147 4.256-.9 4.256-.9l-.083-1.751s-1.909.549-4.248.48c-2.326-.074-4.805-.272-5.19-3.058-.04-.285-.041-.59-.033-.9 1.971.479 3.912.596 5.699.51 1.777-.086 3.584-.342 5.39-.735 3.191-.695 4.465-2.312 4.465-2.312.093-1.508.059-2.997.059-4.188zm-4.319 9.74h-2.428V9.255c0-1.281-.519-1.93-1.557-1.93-.864 0-1.484.59-1.861 1.771L12 10.829l-1.028-1.733c-.377-1.181-.997-1.771-1.861-1.771-1.038 0-1.557.65-1.557 1.93v8.364H5.126V9.149c0-2.428 1.556-3.624 3.557-3.624 1.162 0 2.056.445 2.688 1.312L12 7.829l.629-1.002c.632-.867 1.526-1.312 2.688-1.312 2.001 0 3.557 1.196 3.557 3.624v8.47z"/>
  </svg>
);

const BlueskyIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C3.405 1.447 1.457 1.62 1.457 3.412c0 1.501.97 5.56 1.457 7.027.652 1.965 2.143 2.436 4.003 2.236-1.859.2-3.351-.271-4.003-2.236-.487-1.467-1.457-5.526-1.457-7.027 0-1.792 1.948-1.965 3.745-.592 2.752 1.942 5.711 5.881 6.798 7.995 1.087-2.114 4.046-6.053 6.798-7.995 1.797-1.373 3.745-1.2 3.745.592 0 1.501-.97 5.56-1.456 7.027-.652 1.965-2.144 2.436-4.003 2.236 1.859.2 3.351-.271 4.003-2.236.487-1.467 1.457-5.526 1.457-7.027 0-1.792-1.948-1.965-3.745-.592-2.752 1.942-5.711 5.881-6.798 7.995zM12 13.2c-1.087 2.114-4.046 6.053-6.798 7.995-1.797 1.373-3.745 1.2-3.745-.592 0-1.501.97-5.56 1.457-7.027.652-1.965 2.143-2.436 4.003-2.236-1.859-.2-3.351.271-4.003 2.236-.487 1.467-1.457-5.526-1.457 7.027 0 1.792 1.948 1.965 3.745.592 2.752-1.942 5.711-5.881 6.798-7.995 1.087 2.114 4.046 6.053 6.798 7.995 1.797 1.373 3.745 1.2 3.745-.592 0-1.501-.97-5.56-1.456-7.027-.652-1.965-2.144-2.436-4.003-2.236 1.859-.2 3.351.271 4.003 2.236.487 1.467 1.457 5.526 1.457 7.027 0 1.792-1.948 1.965-3.745.592-2.752-1.942-5.711-5.881-6.798-7.995z"/>
  </svg>
);

export default function Footer() {
  const primarySocials = (
    <div className="flex justify-center gap-5">
      <a href="https://github.com/w3develops/w3develops" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary flex items-center justify-center">
        <Github className="h-6 w-6" />
      </a>
      <a href="https://x.com/w3develops" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary flex items-center justify-center">
        <Twitter className="h-6 w-6" />
      </a>
      <a href="https://www.youtube.com/w3Develops?sub_confirmation=1" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary flex items-center justify-center">
        <Youtube className="h-6 w-6" />
      </a>
      <a href="https://www.facebook.com/groups/w3develops/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary flex items-center justify-center">
        <Facebook className="h-6 w-6" />
      </a>
      <a href="https://discord.gg/ckQ52gA" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary flex items-center justify-center">
        <DiscordIcon className="h-6 w-6" />
      </a>
      <a href="https://mastodon.social/@w3develops" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary flex items-center justify-center">
        <MastodonIcon className="h-6 w-6" />
      </a>
    </div>
  );

  const secondarySocials = (
    <div className="flex justify-center gap-5">
      <a href="https://bsky.app/profile/w3develops.bsky.social" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary flex items-center justify-center">
        <BlueskyIcon className="h-6 w-6" />
      </a>
      <a href="https://www.instagram.com/w3develops/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary flex items-center justify-center">
        <Instagram className="h-6 w-6" />
      </a>
      <a href="https://medium.com/w3develops" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary flex items-center justify-center">
        <MediumIcon className="h-6 w-6" />
      </a>
      <a href="https://www.linkedin.com/company/w3develops" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary flex items-center justify-center">
        <Linkedin className="h-6 w-6" />
      </a>
      <a href="https://www.reddit.com/r/w3Develops/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary flex items-center justify-center">
        <RedditIcon className="h-6 w-6" />
      </a>
      <a href="https://www.youtube.com/watch?v=VLZhlngst2E&list=PLTwiqKOPckq-z5E-LUpMXpcv_GWXE2k4F" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary flex items-center justify-center">
        <Podcast className="h-6 w-6" />
      </a>
    </div>
  );

  return (
    <footer className="bg-[#212529] border-t border-border/5 py-10 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8">
          
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">Made with ❤️ for a better web</p>
            <div className="flex justify-center gap-x-6 gap-y-3 text-sm font-medium flex-wrap max-w-2xl">
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              <Link href="/terms" className="text-primary hover:underline">Terms of Use</Link>
              <Link href="/cookies" className="text-primary hover:underline">Cookies</Link>
              <Link href="/newsletter" className="text-primary hover:underline">Newsletter</Link>
              <Link href="/donate" className="text-primary hover:underline">Donate</Link>
              <Link href="/marketplace" className="text-primary hover:underline">Marketplace</Link>
              <Link href="/feedback" className="text-primary hover:underline">Feedback</Link>
              <Link href="/support" className="text-primary hover:underline">Support</Link>
              <Link href="/contribute" className="text-primary hover:underline">Contribute</Link>
              <Link href="/careers" className="text-primary hover:underline">Careers</Link>
              <Link href="/faq" className="text-primary hover:underline">FAQ</Link>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-10 gap-y-6 w-full pt-4">
            {primarySocials}
            {secondarySocials}
          </div>

        </div>
      </div>
    </footer>
  );
}
