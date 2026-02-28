import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Image optimization — add trusted domains here as they become known
  images: {
    remotePatterns: [],
  },
  // Strict mode for catching React issues early
  reactStrictMode: true,
};

export default nextConfig;
