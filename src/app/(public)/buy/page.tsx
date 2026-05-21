import { redirect } from "next/navigation";

/** Buy page disabled — customers open their agent's store link directly. */
export default function BuyPage() {
  redirect("/");
}

/*
import Link from "next/link";
import { ArrowRight, Store, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { VendorStoreEntry } from "@/components/store/vendor-store-entry";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Buy Data",
  description:
    "Open your agent's DCS store to buy MTN, Telecel, and AirtelTigo data bundles with MoMo.",
};

export default function BuyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        imageSrc="/hero-customer.png"
        imageAlt="Customer buying data through their agent's DCS store"
        imagePosition="68% 28%"
        accent="gold"
      >
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-glow">
            <Store className="h-3.5 w-3.5" />
            Buy data
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Your agent&apos;s store.{" "}
            <span className="text-aurora">One private link.</span>
          </h1>
          <p className="mt-2 max-w-md text-sm text-slate-300">
            DCS powers independent data agents — buy only through the store link your
            agent shared with you.
          </p>
        </div>
      </PageHero>

      <div className="relative z-10 mx-auto max-w-lg px-4 pb-16 pt-0 sm:px-6 lg:px-8">
        <div className="-mt-10">
          <VendorStoreEntry variant="page" />
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-white p-5">
          <h2 className="text-sm font-bold text-foreground">How it works</h2>
          <ol className="mt-3 space-y-3 text-xs text-muted">
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[10px] font-bold text-gold-dark">
                1
              </span>
              Get your agent&apos;s store link on WhatsApp or social media.
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[10px] font-bold text-gold-dark">
                2
              </span>
              Paste the link or store name above to open their catalogue.
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[10px] font-bold text-gold-dark">
                3
              </span>
              Pick a bundle, pay with MoMo, and receive data in seconds.
            </li>
          </ol>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-gold-dark" />
            Secured by Paystack · BoG-licensed rails
          </p>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/create-store">
              Want to sell data? Create your store
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
*/
