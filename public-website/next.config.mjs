/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Fix workspace root detection issue
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;