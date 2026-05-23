import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Shield, Sparkles, Zap, Clock } from "lucide-react";
import { getCurrentVendor, getSessionUser } from "@/lib/auth/session";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { SITE } from "@/lib/constants";
import { CreateStoreWizard } from "./wizard";

export const metadata: Metadata = {
  title: "Create Your Data Store — Sell MTN, Telecel & AT Data in Ghana",
  description:
    "Launch your branded storefront on DCS ELITE in minutes. Set your own prices, accept Mobile Money, and earn on every MTN, Telecel and AirtelTigo data sale.",
  alternates: { canonical: "/create-store" },
  keywords: [
    "create data store Ghana",
    "sell data Ghana",
    "data reseller business Ghana",
    "MoMo data vendor",
    "DCS ELITE vendor",
    "start data business Ghana",
  ],
  openGraph: {
    title: "Sell data with your own DCS ELITE storefront",
    description:
      "Branded storefront, instant fulfilment, wholesale wallet, vendor analytics and 24/7 support. Set up in minutes.",
    url: `${SITE.url}/create-store`,
    type: "website",
  },
  twitter: {
    title: "Start your own data store on DCS ELITE",
    description:
      "Launch a branded data store in minutes. Sell MTN, Telecel & AirtelTigo bundles with secure MoMo payments.",
  },
};

export const dynamic = "force-dynamic";

export default async function CreateStorePage() {
  let signedInEmail: string | null = null;

  if (hasSupabaseConfig()) {
    const vendor = await getCurrentVendor();
    if (vendor) redirect("/vendor/dashboard");

    const user = await getSessionUser();
    signedInEmail = user?.email ?? null;
  }
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Hero band */}
      <section className="relative isolate min-h-[300px] overflow-hidden sm:min-h-[340px]">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/hero-create-store.png"
            alt="A Ghanaian entrepreneur launching a data storefront on DCS"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "75% 25%" }}
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background: `
              linear-gradient(95deg,
                rgba(6, 9, 20, 0.95) 0%,
                rgba(6, 9, 20, 0.88) 40%,
                rgba(6, 9, 20, 0.45) 65%,
                rgba(6, 9, 20, 0.25) 100%),
              linear-gradient(180deg,
                rgba(6, 9, 20, 0.2) 0%,
                rgba(6, 9, 20, 0.75) 100%)
            `,
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background: `
              radial-gradient(ellipse 50% 50% at 15% 30%, rgba(34, 211, 238, 0.2), transparent 60%),
              radial-gradient(ellipse 40% 40% at 90% 80%, rgba(139, 92, 246, 0.12), transparent 55%)
            `,
            mixBlendMode: "screen",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-4 pb-28 pt-10 sm:px-6 sm:pt-12 lg:pb-32">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            Sell on DCS
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Launch your storefront
            <span className="text-aurora"> in minutes</span>
          </h1>
          <p className="mt-2 max-w-md text-sm text-slate-300">
            One form: create your account, verify, pay the setup fee, and launch your store.
          </p>
          <ul className="mt-5 hidden flex-wrap gap-2 sm:flex">
            {[
              { icon: Zap, text: "Wholesale bundles" },
              { icon: Shield, text: "Verified badge" },
              { icon: Clock, text: "~5 min setup" },
            ].map((item) => (
              <li
                key={item.text}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200 backdrop-blur-sm"
              >
                <item.icon className="h-3.5 w-3.5 text-cyan-400" />
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Wizard overlaps hero */}
      <div className="relative z-10 -mt-24 px-4 pb-16 sm:px-6">
        <Suspense
          fallback={
            <div className="skeleton mx-auto h-[520px] max-w-2xl rounded-2xl shadow-xl" />
          }
        >
          <CreateStoreWizard signedInEmail={signedInEmail} />
        </Suspense>
      </div>
    </div>
  );
}
