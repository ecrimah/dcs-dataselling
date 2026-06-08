import type { Metadata } from "next";
import Link from "next/link";
import { Code2, Key, Webhook } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { DocsBrowser } from "@/app/vendor/dashboard/developer/docs-browser";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Developer API Documentation",
  description: `Integrate ${SITE.name} into your app, bot, or reseller workflow. REST API for bundles, orders, webhooks, and wallet-backed fulfilment.`,
  alternates: { canonical: "/developers" },
};

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        imageSrc="/hero-vendors.png"
        imageAlt="DCS ELITE developer API"
        accent="gold"
      >
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
            <Code2 className="h-3.5 w-3.5" />
            Developer API
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Sell data{" "}
            <span className="text-aurora">programmatically</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            REST endpoints for bundles, single &amp; bulk orders, account balance, and outbound
            webhooks. Authenticate with a Bearer API key from your vendor dashboard.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/api-access"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg"
            >
              <Key className="h-4 w-4" />
              Get API keys (no store)
            </Link>
            <Link
              href="/create-store"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm"
            >
              Or create a full store
            </Link>
          </div>
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Key,
              title: "Bearer auth",
              desc: "Issue keys from /vendor/dashboard/developer. Prefix shown once — store it safely.",
            },
            {
              icon: Webhook,
              title: "Webhooks",
              desc: "Configure a URL to receive order.fulfilled, order.failed, and wallet events.",
            },
            {
              icon: Code2,
              title: "Base URL",
              desc: `${SITE.url.replace(/^https?:\/\//, "")}/api/v1 — all routes below are relative to this.`,
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-elevated p-4">
              <Icon className="h-5 w-5 text-amber-600" />
              <h3 className="mt-2 font-bold text-foreground">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">{desc}</p>
            </div>
          ))}
        </div>

        <DocsBrowser apiBase={`${SITE.url.replace(/\/$/, "")}/api/v1`} />
      </div>
    </div>
  );
}
