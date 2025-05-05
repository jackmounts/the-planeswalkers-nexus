import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@models/shared": path.resolve(__dirname, "../../packages/shared"),
    };
    return config;
  },
};

export default nextConfig;
