import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Image optimization — artwork serves from Vercel Blob in deployed
  // environments (Architecture §6); the store subdomain is assigned per
  // project, so the pattern wildcards it.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },
  // Strict mode for catching React issues early
  reactStrictMode: true,
};

export default nextConfig;
