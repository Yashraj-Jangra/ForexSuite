/** @type {import('next').NextConfig} */
const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@vaultbill/shared', '@vaultbill/config'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [{ key: 'Service-Worker-Allowed', value: '/' }],
      },
    ];
  },
};

module.exports = nextConfig;