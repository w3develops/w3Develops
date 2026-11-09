
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
  async redirects() {
    return [
      { source: '/forum', destination: 'https://discord.gg/ckQ52gA', permanent: false },
      { source: '/forum/:path*', destination: 'https://discord.gg/ckQ52gA', permanent: false },
    ];
  },
};

module.exports = nextConfig;
