import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const base = SITE.url.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/vendor/", "/support", "/create-store", "/orders/", "/checkout"],
        disallow: [
          "/admin/",
          "/admin",
          "/vendor/dashboard",
          "/vendor/dashboard/",
          "/api/",
          "/auth/",
          "/account",
          "/orders/", // Per-order pages are private (signed URLs)
          "/checkout", // Live transactional page
          "/*?ref=*",  // Tracking params
          "/*?paid=*",
        ],
      },
      // Heavyweight social/AI scrapers — opt-in only for our marketing pages
      {
        userAgent: ["GPTBot", "ChatGPT-User", "ClaudeBot", "CCBot", "Google-Extended", "PerplexityBot", "anthropic-ai"],
        allow: ["/", "/support"],
        disallow: [
          "/admin/",
          "/vendor/dashboard/",
          "/api/",
          "/auth/",
          "/account",
          "/orders/",
          "/checkout",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
