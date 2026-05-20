import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/constants";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.shortName}`,
  },
  description: SITE.description,
  keywords: [
    "data bundles Ghana",
    "buy MTN data",
    "Telecel data",
    "AT data bundles",
    "data reseller Ghana",
    "DCS ELITE",
    "dcselite.com",
  ],
  openGraph: {
    type: "website",
    locale: "en_GH",
    siteName: SITE.name,
    title: SITE.tagline,
    description: SITE.description,
    images: [
      {
        url: SITE.ogImage,
        width: 614,
        height: 377,
        alt: SITE.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.tagline,
    description: SITE.description,
    images: [SITE.ogImage],
  },
  icons: {
    apple: [{ url: "/brand/apple-touch-icon.png", type: "image/png" }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A2E5D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">{children}</body>
    </html>
  );
}
