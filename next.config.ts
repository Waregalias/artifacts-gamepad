import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/controller',
        permanent: true,
      },
    ];
  },

};

export default nextConfig;
