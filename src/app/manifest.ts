import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: SITE.backgroundColor,
    theme_color: SITE.themeColor,
    lang: SITE.language,
    dir: "ltr",
    categories: ["business", "finance", "shopping", "utilities"],
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Buy data",
        short_name: "Buy data",
        description: "Browse data bundles and place an order",
        url: "/",
      },
      {
        name: "Open my store",
        short_name: "My store",
        description: "Open the vendor dashboard",
        url: "/vendor/dashboard",
      },
      {
        name: "Become a vendor",
        short_name: "Create store",
        description: "Launch your own data store on DCS ELITE",
        url: "/create-store",
      },
    ],
  };
}
