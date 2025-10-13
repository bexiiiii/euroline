import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'img.laximo.ru',
      'api.euroline.storage.1edu.kz',
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'img.laximo.ru' },
      { protocol: 'http', hostname: 'img.laximo.ru' },
      { protocol: 'https', hostname: 'api.euroline.storage.1edu.kz' },
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
