import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://euroline.1edu.kz";

const staticRoutes: Array<{ path: string; priority?: number }> = [
  { path: "/", priority: 1 },
  { path: "/aboutus", priority: 0.6 },
  { path: "/contacts", priority: 0.6 },
  { path: "/news", priority: 0.7 },
  { path: "/partners", priority: 0.6 },
  { path: "/seasonal-products", priority: 0.5 },
  { path: "/oil-and-chemicals", priority: 0.6 },
  { path: "/weekly-product", priority: 0.5 },
  { path: "/help", priority: 0.4 },
  { path: "/parts-catalog", priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  return staticRoutes.map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority,
  }));
}
