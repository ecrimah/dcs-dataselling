import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { fetchVendors } from "@/lib/data/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const vendors = await fetchVendors();
  const vendorUrls = vendors.map((v) => ({
    url: `${base}/vendor/${v.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/marketplace`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    { url: `${base}/vendors`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    {
      url: `${base}/create-store`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${base}/support`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    ...vendorUrls,
  ];
}
