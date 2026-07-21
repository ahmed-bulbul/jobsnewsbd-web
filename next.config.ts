import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8081', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'http://api.jobradarbd.com/', pathname: '/uploads/**' },
    ],
  },
};

export default nextConfig;
