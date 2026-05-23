import { SITE } from "@/lib/constants";

/** Build a JSON-LD BreadcrumbList from an array of segments. */
export function breadcrumbList(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE.url}${item.url}`,
    })),
  };
}

/** Build a JSON-LD FAQPage from an array of Q/A pairs. */
export function faqPage(qa: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/** Build a JSON-LD LocalBusiness for the platform itself. */
export function localBusiness() {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineBusiness",
    "@id": `${SITE.url}#business`,
    name: SITE.name,
    url: SITE.url,
    description: SITE.longDescription,
    image: `${SITE.url}/opengraph-image`,
    telephone: SITE.supportWhatsApp,
    email: SITE.supportEmail,
    address: {
      "@type": "PostalAddress",
      addressCountry: SITE.countryCode,
      addressLocality: SITE.country,
    },
    areaServed: {
      "@type": "Country",
      name: SITE.country,
    },
    priceRange: "₵",
    sameAs: Object.values(SITE.socials),
  };
}

/** Build a JSON-LD Store for a vendor storefront. */
export function vendorStore(args: {
  slug: string;
  businessName: string;
  tagline?: string | null;
  themeColor?: string | null;
  logoUrl?: string | null;
  rating?: number;
  ratingCount?: number;
  bundlesOffered?: number;
}) {
  const url = `${SITE.url}/vendor/${args.slug}`;
  const aggregateRating =
    args.rating && args.ratingCount && args.ratingCount > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: args.rating,
          reviewCount: args.ratingCount,
          bestRating: 5,
          worstRating: 0,
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${url}#store`,
    name: args.businessName,
    url,
    description:
      args.tagline ??
      `Buy MTN, Telecel and AirtelTigo data bundles from ${args.businessName} on ${SITE.name}. Instant delivery, secure MoMo payments.`,
    image: args.logoUrl ?? `${url}/opengraph-image`,
    parentOrganization: { "@id": `${SITE.url}#organization` },
    paymentAccepted: "Mobile Money, Card, Bank Transfer",
    currenciesAccepted: SITE.currency,
    areaServed: {
      "@type": "Country",
      name: SITE.country,
    },
    ...(aggregateRating ? { aggregateRating } : {}),
    ...(args.bundlesOffered
      ? {
          makesOffer: {
            "@type": "Offer",
            description: `${args.bundlesOffered} data bundles in store`,
            availability: "https://schema.org/InStock",
            areaServed: SITE.country,
            priceCurrency: SITE.currency,
          },
        }
      : {}),
  };
}
