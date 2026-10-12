import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.destaka.com.br' }],
        destination: 'https://destaka.com.br/:path*',
        permanent: true,
      },
    ]
  },
  // Security headers are set in proxy.ts (single source of truth)
  // Only X-Frame-Options kept here as fallback for static assets not processed by proxy
};

export default nextConfig;
