import Link from "next/link";
import { ArrowRight, ShieldCheck, Store, Users } from "lucide-react";
import { fetchVendors } from "@/lib/data/queries";
import { VendorCard } from "@/components/marketplace/vendor-card";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Verified Vendors",
  description: "Browse trusted data vendors on the DCS marketplace.",
};

export const revalidate = 120;

export default async function VendorsPage() {
  const vendors = await fetchVendors();
  const featured = vendors.filter((v) => v.featured);
  const rest = vendors.filter((v) => !v.featured);

  const avgRating =
    vendors.length > 0
      ? (vendors.reduce((s, v) => s + v.rating, 0) / vendors.length).toFixed(1)
      : "—";
  const avgFulfilment =
    vendors.length > 0
      ? Math.round(
          vendors.reduce((s, v) => s + v.fulfilmentMinutes, 0) / vendors.length,
        )
      : 0;

  return (
    <div className="min-h-screen">
      <PageHero
        imageSrc="/hero-vendors.png"
        imageAlt="A verified DCS vendor serving customers with mobile data in Ghana"
        imagePosition="72% 25%"
        accent="cyan"
        footer={
          <div className="flex flex-wrap gap-3">
            <Button size="sm" asChild>
              <Link href="/marketplace">
                Browse bundles
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/create-store">Become a vendor</Link>
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              DCS-verified sellers
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Shop trusted vendors
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Every seller is verified. Compare ratings, speed, and bundles — then buy
              with MoMo in seconds.
            </p>
          </div>

          <div className="hidden flex-wrap gap-2 sm:flex lg:justify-end">
            <StatPill icon={Users} label="Vendors" value={String(vendors.length)} />
            <StatPill icon={Store} label="Avg rating" value={avgRating} />
            <StatPill
              icon={ShieldCheck}
              label="Avg delivery"
              value={avgFulfilment ? `~${avgFulfilment}m` : "—"}
            />
          </div>
        </div>
      </PageHero>

      <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          {vendors.length === 0 ? (
            <div className="card-elevated py-16 text-center">
              <p className="text-sm font-semibold text-foreground">No vendors yet</p>
              <p className="mt-1 text-xs text-muted">Check back soon or sell on DCS.</p>
              <Button className="mt-4" size="sm" asChild>
                <Link href="/create-store">Create your store</Link>
              </Button>
            </div>
          ) : (
            <>
              {featured.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-end justify-between gap-3">
                    <h2 className="text-sm font-bold text-foreground">Featured vendors</h2>
                    <span className="text-xs text-muted">{featured.length} highlighted</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
                    {featured.map((vendor) => (
                      <VendorCard key={vendor.id} vendor={vendor} featured />
                    ))}
                  </div>
                </section>
              )}

              {rest.length > 0 && (
                <section>
                  {featured.length > 0 && (
                    <h2 className="mb-4 text-sm font-bold text-foreground">All vendors</h2>
                  )}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
                    {rest.map((vendor) => (
                      <VendorCard key={vendor.id} vendor={vendor} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-cyan-400" />
        <div>
          <p className="num text-lg font-extrabold leading-none text-white">{value}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
