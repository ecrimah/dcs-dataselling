import { notFound } from "next/navigation";
import { BadgeCheck, Star } from "lucide-react";
import { fetchVendorBySlug, fetchVendorBundles } from "@/lib/data/queries";
import { BundleCard } from "@/components/marketplace/bundle-card";
import { Badge } from "@/components/ui/badge";
import { formatCompact } from "@/lib/format";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vendor = await fetchVendorBySlug(slug);
  if (!vendor) return { title: "Vendor Not Found" };
  return {
    title: `${vendor.businessName} — Data Vendor`,
    description: vendor.tagline ?? `Buy data bundles from ${vendor.businessName} on DCS.`,
  };
}

export default async function VendorStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vendor = await fetchVendorBySlug(slug);
  if (!vendor) notFound();

  const bundles = await fetchVendorBundles(vendor.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="gradient-hero px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold text-white">
              {vendor.businessName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  {vendor.businessName}
                </h1>
                {vendor.verified && (
                  <Badge variant="verified" className="gap-1">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                {vendor.featured && <Badge>Featured</Badge>}
              </div>
              {vendor.tagline && (
                <p className="mt-1 text-slate-300">{vendor.tagline}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {vendor.rating} rating
                </span>
                <span>{formatCompact(vendor.totalOrders)} orders</span>
                <span>~{vendor.fulfilmentMinutes} min delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold">Available bundles</h2>
        {bundles.length === 0 ? (
          <p className="mt-4 text-muted">No bundles listed yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-4 lg:grid-cols-3">
            {bundles.map((b) => (
              <BundleCard key={b.id} bundle={b} variant="compact" />
            ))}
          </div>
        )}
        <p className="mt-8 text-center text-sm text-muted">
          Powered by DCS ELITE — secure payments and instant delivery.
        </p>
      </div>
    </div>
  );
}
