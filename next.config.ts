import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Increase limit (set to what you need, e.g., 20mb) Default is 1mb
    },
  },
};

export default nextConfig;
