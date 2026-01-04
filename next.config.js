const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to prevent double renders
  experimental: {
    optimizePackageImports: ['@heroicons/react']
  },
  // Add empty turbopack config to silence the warning since next-pwa uses webpack
  turbopack: {}
};

module.exports = withPWA(nextConfig);
