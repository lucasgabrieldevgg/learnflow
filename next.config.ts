import type { NextConfig } from "next";

const repoName = '/learnflow';

const nextConfig: NextConfig = {
  output: "export",
  basePath: repoName,
  assetPrefix: repoName,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
