import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { LiveActivityRibbon } from "@/components/home/live-activity-ribbon";
import { HowItWorks } from "@/components/home/how-it-works";
import { NetworkCoverage } from "@/components/home/network-coverage";
import { TrustSection } from "@/components/home/trust-section";
import { Faq } from "@/components/home/faq";
import { FinalCta } from "@/components/home/final-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbList, faqPage, localBusiness } from "@/lib/seo/schema";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    absolute: `${SITE.name} — Buy MTN, Telecel & AirtelTigo Data in Ghana`,
  },
  description:
    "Buy MTN, Telecel and AirtelTigo data bundles in Ghana — or launch your own data store. Instant delivery, secure MoMo & card payments, 24/7 support.",
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name} — Buy MTN, Telecel & AirtelTigo Data in Ghana`,
    description: SITE.longDescription,
    url: SITE.url,
    type: "website",
  },
  twitter: {
    title: `${SITE.name} — Buy data instantly in Ghana`,
    description: SITE.description,
  },
};

const FAQ_LD = [
  {
    question: "How fast does DCS ELITE deliver data bundles?",
    answer:
      "Most MTN, Telecel and AirtelTigo bundles are delivered in under 2 minutes after payment is confirmed. AFA bundles are queued and fulfilled within the network's window.",
  },
  {
    question: "Which networks does DCS ELITE support?",
    answer:
      "MTN, Telecel and AirtelTigo (AT) — covering every major mobile network in Ghana.",
  },
  {
    question: "How do payments work?",
    answer:
      "Customers pay with Mobile Money (MTN, Telecel, AT) or bank cards through Paystack. Vendors top up their DCS wallet to fulfil wholesale orders.",
  },
  {
    question: "Can I sell data through my own store?",
    answer:
      "Yes. Anyone in Ghana can launch a branded storefront on DCS ELITE in minutes, set their own prices, and earn on every sale.",
  },
  {
    question: "Is DCS ELITE safe?",
    answer:
      "Payments run through Paystack with full PCI compliance. Vendor stores are reviewed before going live and orders are protected by an audit trail.",
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[
          localBusiness(),
          breadcrumbList([{ name: "Home", url: "/" }]),
          faqPage(FAQ_LD),
        ]}
      />
      <HeroSection />
      <LiveActivityRibbon />
      <HowItWorks />
      <NetworkCoverage />
      <TrustSection />
      <Faq />
      <FinalCta />
    </>
  );
}
