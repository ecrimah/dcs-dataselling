import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/constants";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const SITE_TITLE = `${SITE.name} — ${SITE.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE.shortName}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.legalName, url: SITE.url }],
  creator: SITE.legalName,
  publisher: SITE.legalName,
  category: "business",
  classification: "Telecommunications & Mobile Data",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.name,
    title: SITE_TITLE,
    description: SITE.longDescription,
    url: SITE.url,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.tagline}`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.twitterHandle,
    creator: SITE.twitterHandle,
    title: SITE_TITLE,
    description: SITE.description,
    images: [
      {
        url: "/twitter-image",
        alt: `${SITE.name} — ${SITE.tagline}`,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "32x32" }],
    shortcut: ["/icon"],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  verification: {
    // Drop verification meta tags below if/when you connect Search Console, etc.
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION }
      : undefined,
  },
  other: {
    "geo.region": "GH",
    "geo.placename": "Ghana",
    "geo.position": "7.9465;-1.0232",
    ICBM: "7.9465, -1.0232",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: SITE.themeColor },
    { media: "(prefers-color-scheme: dark)", color: SITE.themeColor },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/**
 * Site-wide JSON-LD: Organization + WebSite (with SearchAction).
 * Inlined in the body so it's part of the prerendered HTML.
 */
const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE.url}#organization`,
  name: SITE.name,
  legalName: SITE.legalName,
  url: SITE.url,
  logo: {
    "@type": "ImageObject",
    url: `${SITE.url}/apple-icon`,
    width: 180,
    height: 180,
  },
  description: SITE.longDescription,
  foundingDate: `${SITE.foundingYear}-01-01`,
  email: SITE.supportEmail,
  telephone: SITE.supportWhatsApp,
  address: {
    "@type": "PostalAddress",
    addressCountry: SITE.countryCode,
    addressLocality: SITE.country,
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SITE.supportEmail,
      telephone: SITE.supportWhatsApp,
      areaServed: SITE.countryCode,
      availableLanguage: ["English"],
    },
  ],
  sameAs: Object.values(SITE.socials),
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE.url}#website`,
  url: SITE.url,
  name: SITE.name,
  description: SITE.description,
  publisher: { "@id": `${SITE.url}#organization` },
  inLanguage: SITE.locale.replace("_", "-"),
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE.url}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={SITE.language} className={`${jakarta.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
      </body>
    </html>
  );
}
