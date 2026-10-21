import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
  // Демо-страницы шаблона TailAdmin не относятся к админке Euroline:
  // уводим с них на главную, чтобы по прямой ссылке не открывался англоязычный шаблон.
  async redirects() {
    const templatePages = [
      "/signup",
      "/calendar",
      "/blank",
      "/form-elements",
      "/basic-tables",
      "/line-chart",
      "/bar-chart",
      "/alerts",
      "/avatars",
      "/badge",
      "/buttons",
      "/images",
      "/modals",
      "/videos",
      "/error-404",
      // Разделы на демо-данных, не подключённые к API
      "/technical-settings",
      "/marketing",
    ];
    return templatePages.map((source) => ({ source, destination: "/", permanent: false }));
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
