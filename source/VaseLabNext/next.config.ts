import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
    // Files can be 10MB
    serverActions: {
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
