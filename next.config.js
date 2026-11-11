
// Where the site loads things from: Firebase (Auth, Firestore, Storage,
// Functions), App Check's reCAPTCHA, Google Analytics, and the Discord and
// YouTube embeds. Images can come from any https address, since profile
// pictures are links members add.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com https://apis.google.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.cloudfunctions.net https://*.run.app https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://www.google.com",
  "frame-src 'self' https://*.firebaseapp.com https://www.google.com https://recaptcha.google.com https://discord.com https://www.youtube.com https://www.youtube-nocookie.com",
  "media-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      }
    ],
  },
  // The community forum is the w3Develops Discord for now. Temporary (307)
  // redirects, so /forum can become a real page later without search
  // engines remembering the old destination.
  // Basic security headers on every page (issue #467). HSTS tells browsers
  // to use HTTPS only; the others stop the site being framed by other sites,
  // stop browsers guessing file types, limit what referrers reveal, and turn
  // off browser features the site doesn't use. Camera and microphone stay
  // allowed for the site itself.
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=()' },
        // Report-only for now: browsers log anything this would block in the
        // console, without blocking it. Once it's quiet, rename the key to
        // Content-Security-Policy to enforce it.
        { key: 'Content-Security-Policy-Report-Only', value: CONTENT_SECURITY_POLICY },
      ],
    }];
  },
  async redirects() {
    return [
      { source: '/forum', destination: 'https://discord.gg/ckQ52gA', permanent: false },
      { source: '/forum/:path*', destination: 'https://discord.gg/ckQ52gA', permanent: false },
    ];
  },
};

module.exports = nextConfig;
