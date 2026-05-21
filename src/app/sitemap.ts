import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

/** Public sitemap — no vendor directory or per-vendor listing (isolated storefronts only). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;

  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/create-store`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${base}/support`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];
}
