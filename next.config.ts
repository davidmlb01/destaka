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
};

export default nextConfig;
