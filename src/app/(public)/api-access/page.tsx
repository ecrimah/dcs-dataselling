import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Code2 } from "lucide-react";

import { PageHero } from "@/components/layout/page-hero";
import { getCurrentVendor, getSessionUser } from "@/lib/auth/session";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { SITE } from "@/lib/constants";

import { ApiAccessForm } from "./api-access-form";

export const metadata: Metadata = {
  title: "Developer API Access",
  description: `Connect your own app, bot, or website to ${SITE.name}. Get API keys without setting up a storefront.`,
  alternates: { canonical: "/api-access" },
};

export const dynamic = "force-dynamic";

export default async function ApiAccessPage() {
  let signedInEmail: string | null = null;

  if (hasSupabaseConfig()) {
    const vendor = await getCurrentVendor();
    if (vendor) redirect("/vendor/dashboard/developer");
    const user = await getSessionUser();
    signedInEmail = user?.email ?? null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero imageSrc="/hero-vendors.png" imageAlt="DCS ELITE developer API" accent="gold">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
            <Code2 className="h-3.5 w-3.5" />
            Developer API
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Connect to our API <span className="text-aurora">without a store</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            If you only need API keys to plug DCS into your own app, bot, or website, you don&apos;t
            need to open a storefront. Sign up here and an admin will approve your access.
          </p>
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <ApiAccessForm signedInEmail={signedInEmail} />
      </div>
    </div>
  );
}
