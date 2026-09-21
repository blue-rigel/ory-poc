import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["orypoc.test"],
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/auth/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
