import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { formatGHS, formatCompact } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentVendor } from "@/lib/auth/session";
import { fetchVendorDashboardStats } from "@/lib/data/queries";
import { fetchVendorListings } from "@/lib/data/wholesale";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");

  if (!vendor.setupFeePaidAt) {
    return (
      <div className="space-y-6">
        <SetupFeeGate />
      </div>
    );
  }

  const [listings, dashStats] = await Promise.all([
    fetchVendorListings(vendor.id),
    fetchVendorDashboardStats(vendor.id),
  ]);
  const activeListings = listings.filter((l) => l.active).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue (30d)" value={formatGHS(dashStats.revenue30d)} icon={DollarSign} />
        <StatCard label="Orders" value={formatCompact(dashStats.orders)} icon={ShoppingCart} />
        <StatCard
          label="Success rate"
          value={dashStats.orders > 0 ? `${dashStats.successRate}%` : "—"}
          icon={TrendingUp}
        />
        <StatCard label="Active listings" value={String(activeListings)} icon={Package} />
      </div>

      {activeListings === 0 && (
        <div className="card-elevated p-6">
          <Badge>Get started</Badge>
          <h3 className="mt-3 text-lg font-bold">Order your first data bundle</h3>
          <p className="mt-1 text-sm text-muted">
            Browse the DCS wholesale catalogue, place orders, then set your markup to resell.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/vendor/dashboard/wholesale">
                Buy data
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/vendor/dashboard/catalogue">Set resale pricing</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Your listings</h2>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/vendor/dashboard/catalogue">Manage</Link>
            </Button>
          </div>
          {listings.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No listings yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {listings.slice(0, 5).map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between rounded-xl border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{l.wholesale.name}</p>
                    <p className="text-xs text-muted">+₵{l.markupAmount.toFixed(2)} markup</p>
                  </div>
                  <Badge variant={l.active ? "success" : "neutral"}>
                    {l.active ? "Live" : "Hidden"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-elevated p-5">
          <h2 className="font-semibold">Share your store</h2>
          <p className="mt-1 text-sm text-muted">
            Send your store link to friends, customers, and groups.
          </p>
          <Button className="mt-4 w-full" variant="secondary" asChild>
            <Link href="/vendor/dashboard/storefront">Open share kit</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
