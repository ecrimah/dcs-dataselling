import type { Metadata } from "next";
import Link from "next/link";
import { Lock, ShieldCheck, Timer } from "lucide-react";
import { ContentPage, ContentSection } from "@/components/layout/content-page";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Trust & Security",
  description: `How ${SITE.name} protects payments, fulfils orders securely, and keeps vendor and customer data safe.`,
  alternates: { canonical: "/trust" },
};

const PILLARS = [
  {
    icon: Lock,
    title: "Licensed payments",
    body: "All customer checkout runs through Paystack — PCI-DSS aligned, webhook-verified, and encrypted in transit with TLS.",
  },
  {
    icon: Timer,
    title: "Instant fulfilment",
    body: "Orders queue to licensed suppliers (MTN via Skanka5 and manual fallback for other networks). Most bundles deliver in under two minutes.",
  },
  {
    icon: ShieldCheck,
    title: "Dispute protection",
    body: "Failed orders are logged with a full audit trail. Vendors and customers can escalate via the complaints flow or WhatsApp support.",
  },
];

export default function TrustPage() {
  return (
    <ContentPage
      title="Trust & Security"
      subtitle="Built like a bank. Moves like fintech. Your payments, orders, and store data are protected at every step."
      imageSrc="/hero-trust.png"
      imageAlt="Secure data commerce on DCS ELITE"
      accent="emerald"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {PILLARS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-xl border border-border bg-slate-50/80 p-4"
          >
            <Icon className="h-5 w-5 text-emerald-600" />
            <h3 className="mt-2 font-bold text-foreground">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>

      <ContentSection title="Data handling">
        <p>
          We store only what is needed to run your store and fulfil orders — account details,
          order history, wallet balances, and API usage logs for vendors using the developer
          platform. We do not sell personal data to third parties.
        </p>
        <p>
          Read our full{" "}
          <Link href="/privacy" className="font-semibold text-amber-700 hover:underline">
            Privacy Policy
          </Link>{" "}
          for details on retention, access, and your rights.
        </p>
      </ContentSection>

      <ContentSection title="Vendor verification">
        <p>
          Every storefront is reviewed before it goes live. Admin operators can suspend stores
          that violate platform rules. KYC and compliance notes are tracked in the admin panel.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
