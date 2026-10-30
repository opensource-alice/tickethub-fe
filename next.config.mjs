/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@tanstack/react-query', '@tanstack/query-core'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.ticketm.net',
      },
      {
        protocol: 'https',
        hostname: 's1.ticketm.net',
      },
      {
        protocol: 'https',
        hostname: '*.ticketmaster.com',
      },
      {
        protocol: 'https',
        hostname: 'media.ticketmaster.com',
      },
      {
        protocol: 'https',
        hostname: '*.universe.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
