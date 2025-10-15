import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://euroline.1edu.kz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/cabinet", "/profile", "/order-history", "/order-returns"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
