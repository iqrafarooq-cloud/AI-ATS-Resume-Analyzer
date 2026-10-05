import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mammoth", "unpdf"],
  poweredByHeader: false,
  devIndicators: false,
};

export default nextConfig;
