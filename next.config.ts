import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/vendors",
        destination: "/",
        permanent: true,
      },
      {
        source: "/vendors/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/marketplace",
        destination: "/buy",
        permanent: true,
      },
      {
        source: "/marketplace/:path*",
        destination: "/buy",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
