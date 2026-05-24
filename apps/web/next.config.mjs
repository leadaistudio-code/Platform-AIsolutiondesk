import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tell Next this app lives inside a monorepo so it picks the right root
  // (silences the "multiple lockfiles" warning).
  outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
  experimental: {
    // Smaller, faster icon imports.
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
