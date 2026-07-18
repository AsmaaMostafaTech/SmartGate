import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: "output: standalone" removed — Vercel has its own build system and
  // standalone mode can cause runtime issues there. Keep it only for self-hosting.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
