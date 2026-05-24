import type { Metadata } from "next";
import { ContentPage, ContentSection } from "@/components/layout/content-page";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms governing use of ${SITE.name} (${SITE.domain}) — vendors, customers, and API users.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms of Service"
      subtitle={`These terms apply to everyone who uses ${SITE.domain} — buyers, vendors, and API integrators.`}
      imageSrc="/hero-auth.png"
      imageAlt="DCS ELITE terms of service"
    >
      <ContentSection title="1. The platform">
        <p>
          {SITE.name} provides a marketplace and tooling for buying and selling mobile data
          bundles in Ghana. We are a technology platform — not a mobile network operator. Data
          is supplied by licensed third-party fulfilment partners.
        </p>
      </ContentSection>

      <ContentSection title="2. Vendor accounts">
        <p>
          Vendors must provide accurate business information, pay any applicable setup fees,
          and comply with network and regulatory rules. {SITE.name} may suspend or remove stores
          that engage in fraud, abuse, or repeated failed fulfilment.
        </p>
      </ContentSection>

      <ContentSection title="3. Customer orders">
        <p>
          Prices shown on a vendor storefront are set by that vendor. Payment is processed by
          Paystack. Refunds for failed fulfilment are handled according to platform policy and
          may be credited back to the payment method or resolved via support.
        </p>
      </ContentSection>

      <ContentSection title="4. Developer API">
        <p>
          API keys are issued per vendor account. You are responsible for securing your keys,
          monitoring usage, and complying with rate limits. Abuse of the API may result in key
          revocation without notice.
        </p>
      </ContentSection>

      <ContentSection title="5. Limitation of liability">
        <p>
          {SITE.name} is provided &quot;as is.&quot; We are not liable for network outages,
          supplier delays, or incorrect phone numbers entered at checkout. Our liability is
          limited to the fees paid to us for the affected transaction.
        </p>
      </ContentSection>

      <ContentSection title="6. Contact">
        <p>
          Questions about these terms? Email{" "}
          <a
            href={`mailto:${SITE.supportEmail}`}
            className="font-semibold text-amber-700 hover:underline"
          >
            {SITE.supportEmail}
          </a>
          .
        </p>
        <p className="text-xs text-muted">Last updated: May 2026</p>
      </ContentSection>
    </ContentPage>
  );
}
