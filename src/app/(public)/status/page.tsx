import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, Server } from "lucide-react";
import { ContentPage, ContentSection } from "@/components/layout/content-page";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "System Status",
  description: `Live operational status for ${SITE.name} — checkout, fulfilment, API, and SMS services.`,
  alternates: { canonical: "/status" },
};

const SERVICES = [
  { name: "Website & storefronts", status: "operational" as const },
  { name: "Paystack checkout", status: "operational" as const },
  { name: "Order fulfilment (MTN)", status: "operational" as const },
  { name: "Vendor wallet & wholesale", status: "operational" as const },
  { name: "Developer API (/api/v1)", status: "operational" as const },
  { name: "SMS notifications (Arkesel)", status: "operational" as const },
];

export default function StatusPage() {
  const checkedAt = new Date().toLocaleString("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  });

  return (
    <ContentPage
      title="System Status"
      subtitle="Current health of DCS ELITE services. If something looks wrong, contact support."
      imageSrc="/hero-trust.png"
      imageAlt="DCS ELITE system status"
      accent="emerald"
    >
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="font-bold text-emerald-900">All systems operational</p>
          <p className="text-xs text-emerald-700">Last checked: {checkedAt} (GMT)</p>
        </div>
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border">
        {SERVICES.map((svc) => (
          <li
            key={svc.name}
            className="flex items-center justify-between gap-4 px-4 py-3.5"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Server className="h-4 w-4 text-muted" />
              {svc.name}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Operational
            </span>
          </li>
        ))}
      </ul>

      <ContentSection title="Incident history">
        <p className="flex items-center gap-2 text-muted">
          <Clock className="h-4 w-4" />
          No incidents reported in the last 30 days.
        </p>
      </ContentSection>

      <ContentSection title="Need help?">
        <p>
          Experiencing an issue? Visit the{" "}
          <Link href="/support" className="font-semibold text-amber-700 hover:underline">
            Help Centre
          </Link>{" "}
          or reach us via the WhatsApp and email buttons in the site footer.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
