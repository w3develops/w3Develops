
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
