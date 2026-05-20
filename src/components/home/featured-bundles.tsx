import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fetchBundles } from "@/lib/data/queries";
import { Button } from "@/components/ui/button";
import { FeaturedBundlesTabs } from "./featured-bundles-tabs";

export async function FeaturedBundles() {
  const [popular, bestValue, fastest] = await Promise.all([
    fetchBundles({ sort: "popular", limit: 6 }),
    fetchBundles({ sort: "best_value", limit: 6 }),
    fetchBundles({ sort: "fastest", limit: 6 }),
  ]);

  return (
    <section className="bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <span className="eyebrow text-cyan-600">Top picks</span>
            <h2 className="display-2 mt-2 text-foreground">
              Curated bundles, ready to buy
            </h2>
            <p className="mt-1.5 max-w-xl text-sm text-muted">
              Filtered from {popular.length + bestValue.length} verified vendor listings.
            </p>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/marketplace">
              View marketplace
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="mt-6">
          <FeaturedBundlesTabs
            popular={popular}
            bestValue={bestValue}
            fastest={fastest}
          />
        </div>
      </div>
    </section>
  );
}
