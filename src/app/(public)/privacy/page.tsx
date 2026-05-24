import type { Metadata } from "next";
import { ContentPage, ContentSection } from "@/components/layout/content-page";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE.name} collects, uses, and protects your personal data on ${SITE.domain}.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy Policy"
      subtitle="We collect only what we need to run the platform, fulfil orders, and support you."
      imageSrc="/hero-auth.png"
      imageAlt="DCS ELITE privacy policy"
    >
      <ContentSection title="Information we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>Account details (name, email, phone) when you register or create a store</li>
          <li>Order data (recipient phone, bundle, amount, payment reference)</li>
          <li>Wallet and transaction history for vendor accounts</li>
          <li>API request logs for developer integrations (endpoint, status, latency)</li>
          <li>Support messages sent via email or WhatsApp</li>
        </ul>
      </ContentSection>

      <ContentSection title="How we use it">
        <p>
          Data is used to authenticate users, process payments, fulfil data bundles, prevent
          fraud, provide customer support, and improve the platform. Payment card data is
          handled entirely by Paystack — we never store full card numbers.
        </p>
      </ContentSection>

      <ContentSection title="Sharing">
        <p>
          We share order details with fulfilment suppliers only as needed to deliver bundles.
          We may disclose information if required by law or to protect the platform from abuse.
          We do not sell your personal data.
        </p>
      </ContentSection>

      <ContentSection title="Retention & your rights">
        <p>
          Order and wallet records are retained for accounting and dispute resolution. You may
          request access to or deletion of your account data by contacting{" "}
          <a
            href={`mailto:${SITE.supportEmail}`}
            className="font-semibold text-amber-700 hover:underline"
          >
            {SITE.supportEmail}
          </a>
          . Some records must be kept for legal compliance even after account closure.
        </p>
        <p className="text-xs text-muted">Last updated: May 2026</p>
      </ContentSection>
    </ContentPage>
  );
}
