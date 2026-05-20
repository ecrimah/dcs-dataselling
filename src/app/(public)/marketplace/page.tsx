import { Suspense } from "react";
import { Wifi } from "lucide-react";
import { fetchBundles } from "@/lib/data/queries";
import { PageHero } from "@/components/layout/page-hero";
import { MarketplaceContent } from "./marketplace-content";
import { MarketplaceBanner } from "@/components/marketplace/marketplace-banner";

export const metadata = {
  title: "Buy Data",
  description: "Compare bundles, filter by network, and buy from verified vendors instantly.",
};

export const revalidate = 60;

export default async function MarketplacePage() {
  const bundles = await fetchBundles();

  return (
    <div className="min-h-screen bg-slate-100">
      <PageHero
        imageSrc="/hero-customer.png"
        imageAlt="Customer comparing mobile data bundles on the DCS marketplace"
        imagePosition="68% 28%"
        accent="cyan"
      >
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
            <Wifi className="h-3.5 w-3.5" />
            Buy Data
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Compare bundles.{" "}
            <span className="text-aurora">Buy in seconds.</span>
          </h1>
          <p className="mt-2 max-w-md text-sm text-slate-300">
            MTN, Telecel & AT — verified vendors, MoMo checkout, instant delivery.
          </p>
        </div>
      </PageHero>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="-mt-8 mb-6">
          <MarketplaceBanner />
        </div>

        <Suspense fallback={<MarketplaceSkeleton />}>
          <MarketplaceContent initialBundles={bundles} />
        </Suspense>
      </div>
    </div>
  );
}

function MarketplaceSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
      <div className="skeleton hidden h-80 rounded-2xl lg:block" />
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-44 rounded-2xl sm:h-56" />
        ))}
      </div>
    </div>
  );
}
