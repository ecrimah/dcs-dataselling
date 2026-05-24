import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/layout/content-page";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `About ${SITE.name}`,
  description: `${SITE.name} is Ghana's elite data platform — private storefronts, secure MoMo payments, and instant MTN, Telecel & AirtelTigo fulfilment.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ContentPage
      title={`About ${SITE.name}`}
      subtitle="We help agents launch branded data stores and deliver bundles across Ghana's major networks — fast, secure, and at scale."
      imageSrc="/hero-vendors.png"
      imageAlt="DCS ELITE vendors selling mobile data in Ghana"
      accent="gold"
    >
      <ContentSection title="Our mission">
        <p>
          {SITE.name} exists to make mobile data commerce in Ghana simple for everyone.
          Vendors get a professional storefront in minutes. Customers buy MTN, Telecel, and
          AirtelTigo bundles with Mobile Money or card. Orders route through licensed suppliers
          for near-instant delivery.
        </p>
      </ContentSection>

      <ContentSection title="What we offer">
        <ul className="list-disc space-y-2 pl-5">
          <li>Branded vendor storefronts on {SITE.domain}</li>
          <li>Secure checkout via Paystack (MoMo & cards)</li>
          <li>Wholesale wallet for agents buying data in bulk</li>
          <li>Developer API for bots, resellers, and integrations</li>
          <li>Admin tools for platform operators and support teams</li>
        </ul>
      </ContentSection>

      <ContentSection title="Get started">
        <p>
          Ready to sell?{" "}
          <Link href="/create-store" className="font-semibold text-amber-700 hover:underline">
            Create your store
          </Link>
          . Need help? Visit our{" "}
          <Link href="/support" className="font-semibold text-amber-700 hover:underline">
            Help Centre
          </Link>
          .
        </p>
      </ContentSection>
    </ContentPage>
  );
}
