"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardPageHero } from "@/components/shared/dashboard-page-hero";
import { NetworkBadge } from "@/components/marketplace/network-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDataAmount, formatGHS } from "@/lib/format";
import type { WishlistItem } from "@/types";

interface Props {
  items: WishlistItem[];
  apiBase: "/api/vendor/wishlist" | "/api/admin/wishlist";
  browseHref: string;
  browseLabel: string;
  priceLabel: string;
  variant: "vendor" | "admin";
}

function displayPrice(item: WishlistItem, variant: Props["variant"]) {
  if (variant === "vendor") {
    return item.bundle.tierBuyPrice ?? item.bundle.agentPrice ?? item.bundle.wholesalePrice;
  }
  return item.bundle.agentPrice ?? item.bundle.wholesalePrice;
}

export function WishlistView({
  items,
  apiBase,
  browseHref,
  browseLabel,
  priceLabel,
  variant,
}: Props) {
  const router = useRouter();

  async function remove(bundleId: string) {
    try {
      const res = await fetch(`${apiBase}?bundleId=${encodeURIComponent(bundleId)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not remove");
      toast.success("Removed from wishlist");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove");
    }
  }

  return (
    <div className="space-y-4">
      <DashboardPageHero
        icon={Heart}
        decorativeIcon={Heart}
        badge="Saved bundles"
        title="My Wishlist"
        subtitle="Data bundles you've saved for quick access later."
        actions={
          <Link href={browseHref} className="susu-btn-ghost border-white/15 bg-white/10 text-white hover:bg-white/15">
            <ShoppingBag className="h-4 w-4" />
            {browseLabel}
          </Link>
        }
      />

      <section className="section-card">
        {items.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-50">
              <Heart className="h-8 w-8 text-sky-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Your wishlist is empty</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Save bundles you buy often — tap the heart on any product in the catalogue.
            </p>
            <Link href={browseHref} className="susu-btn-gold mt-5">
              <ShoppingBag className="h-4 w-4" />
              {browseLabel}
            </Link>
          </div>
        ) : (
          <>
            <div className="section-card-header">
              <div>
                <h3 className="font-extrabold tracking-tight text-slate-900">
                  {items.length} saved bundle{items.length === 1 ? "" : "s"}
                </h3>
                <p className="text-sm text-slate-500">{priceLabel}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-amber-200 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <NetworkBadge network={item.bundle.network} size="xs" />
                        {item.bundle.popular && (
                          <Badge variant="warning" className="text-[9px]">
                            Hot
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-2 text-sm font-bold text-slate-900">{item.bundle.name}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDataAmount(item.bundle.dataMb)} · {item.bundle.validityDays} days
                      </p>
                    </div>
                    <p className="shrink-0 text-lg font-bold text-amber-700">
                      {formatGHS(displayPrice(item, variant))}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" asChild>
                      <Link href={`${browseHref}${variant === "vendor" ? `?network=${item.bundle.network}` : ""}`}>
                        <ShoppingBag className="h-3.5 w-3.5" />
                        {variant === "vendor" ? "Buy now" : "View catalogue"}
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => void remove(item.wholesaleBundleId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
