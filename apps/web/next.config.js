/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@vaultbill/shared', '@vaultbill/config'],
};

module.exports = nextConfig;