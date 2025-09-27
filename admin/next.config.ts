import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'img.laximo.ru',
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'img.laximo.ru' },
      { protocol: 'http', hostname: 'img.laximo.ru' },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
