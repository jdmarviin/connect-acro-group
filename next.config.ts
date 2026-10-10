import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep production builds from overwriting a running development server's modules.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.zoom.us',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@zoom/download-manager': false,
      'jszip': false,
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/auth/v1/callback',
        destination: 'https://vlktqilzuvawrkyyunge.supabase.co/auth/v1/callback',
      },
    ];
  },
};

export default nextConfig;
