"use client";

import { useMemo, useState } from "react";
import { Plus, Minus, Eye, EyeOff, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import type { NetworkId } from "@/lib/constants";
import { NETWORKS } from "@/lib/constants";
import { formatGHS, formatDataAmount } from "@/lib/format";
import { NetworkBadge } from "@/components/marketplace/network-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WholesaleBundle, VendorListing } from "@/types";

interface Props {
  vendorId: string;
  wholesale: WholesaleBundle[];
  listings: VendorListing[];
  commissionRate: number;
}

const NETWORK_ACCENT: Record<NetworkId, string> = {
  mtn: "catalogue-network-mtn",
  telecel: "catalogue-network-telecel",
  at: "catalogue-network-at",
};

export function CatalogueEditor({ wholesale, listings: initial, commissionRate }: Props) {
  const [listings, setListings] = useState(initial);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const listingByWholesale = useMemo(() => {
    const map = new Map<string, VendorListing>();
    listings.forEach((l) => map.set(l.wholesaleBundleId, l));
    return map;
  }, [listings]);

  async function activate(wb: WholesaleBundle) {
    setPending((p) => ({ ...p, [wb.id]: true }));
    try {
      const res = await fetch("/api/vendor/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wholesaleBundleId: wb.id, markupAmount: wb.minMarkup || 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setListings((l) => [...l, data.listing]);
      toast.success(`${wb.name} added to your store`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not activate");
    } finally {
      setPending((p) => ({ ...p, [wb.id]: false }));
    }
  }

  async function updateMarkup(listing: VendorListing, markup: number) {
    setListings((ls) =>
      ls.map((l) =>
        l.id === listing.id
          ? { ...l, markupAmount: markup, finalPrice: l.wholesale.customerPrice + markup }
          : l,
      ),
    );
    try {
      await fetch(`/api/vendor/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markupAmount: markup }),
      });
    } catch {
      toast.error("Failed to save markup");
    }
  }

  async function toggleActive(listing: VendorListing) {
    const next = !listing.active;
    setListings((ls) =>
      ls.map((l) => (l.id === listing.id ? { ...l, active: next } : l)),
    );
    await fetch(`/api/vendor/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: next }),
    });
    toast.message(next ? "Bundle visible on storefront" : "Bundle hidden from storefront");
  }

  return (
    <div className="catalogue-editor space-y-5">
      {NETWORKS.map((network) => {
        const items = wholesale.filter((w) => w.network === network.id);
        if (items.length === 0) return null;
        const listedCount = items.filter((w) => listingByWholesale.has(w.id)).length;
        return (
          <section
            key={network.id}
            className={cn("catalogue-network-card overflow-hidden", NETWORK_ACCENT[network.id])}
          >
            <div className="catalogue-network-header flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
              <NetworkBadge network={network.id} size="sm" />
              <h3 className="catalogue-network-title text-sm font-bold">{network.name} bundles</h3>
              <span className="catalogue-count-pill ml-auto text-[11px] font-bold">
                {listedCount}/{items.length} in store
              </span>
            </div>
            <ul className="catalogue-bundle-list divide-y">
              {items.map((wb) => {
                const listing = listingByWholesale.get(wb.id);
                const maxMarkup = wb.maxMarkup ?? wb.wholesalePrice * 2;
                return (
                  <li key={wb.id} className="catalogue-bundle-row px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="catalogue-volume text-lg font-bold tracking-tight">
                            {formatDataAmount(wb.dataMb)}
                          </p>
                          {wb.popular && (
                            <span className="catalogue-popular-pill text-[10px] font-bold uppercase tracking-wide">
                              Popular
                            </span>
                          )}
                          {listing && (
                            <span className="catalogue-in-store-pill text-[10px] font-bold uppercase tracking-wide">
                              In store
                            </span>
                          )}
                        </div>
                        <p className="catalogue-meta mt-1 text-xs">
                          Valid {wb.validityDays} days · Base {formatGHS(wb.customerPrice)}
                        </p>
                      </div>

                      {listing ? (
                        <div className="w-full shrink-0 sm:w-auto sm:min-w-[220px]">
                          <SellPriceEditor
                            basePrice={wb.customerPrice}
                            salePrice={listing.finalPrice}
                            markup={listing.markupAmount}
                            minMarkup={wb.minMarkup}
                            maxMarkup={maxMarkup}
                            earnAmount={listing.markupAmount * (1 - commissionRate / 100)}
                            active={listing.active}
                            onSalePriceChange={(sale) => {
                              const markup = Math.min(
                                maxMarkup,
                                Math.max(wb.minMarkup, sale - wb.customerPrice),
                              );
                              updateMarkup(listing, +markup.toFixed(2));
                            }}
                            onToggleActive={() => toggleActive(listing)}
                          />
                        </div>
                      ) : (
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                          <button
                            type="button"
                            onClick={() => activate(wb)}
                            disabled={pending[wb.id]}
                            className="catalogue-add-btn inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold sm:w-auto"
                          >
                            <Plus className="h-4 w-4" />
                            {pending[wb.id] ? "Adding…" : "Add to store"}
                          </button>
                        </div>
                      )}
                    </div>

                    {listing && wb.suggestedRetail && listing.finalPrice < wb.suggestedRetail && (
                      <p className="catalogue-tip mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed">
                        <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        Suggested retail is {formatGHS(wb.suggestedRetail)} — room to earn more.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {listings.length === 0 && (
        <div className="catalogue-network-card p-8 text-center">
          <Badge>Tip</Badge>
          <p className="catalogue-meta mt-3 text-sm">
            Add bundles above to start selling. Most agents start with 3–5 popular ones.
          </p>
        </div>
      )}
    </div>
  );
}

function SellPriceEditor({
  basePrice,
  salePrice,
  markup,
  minMarkup,
  maxMarkup,
  earnAmount,
  active,
  onSalePriceChange,
  onToggleActive,
}: {
  basePrice: number;
  salePrice: number;
  markup: number;
  minMarkup: number;
  maxMarkup: number;
  earnAmount: number;
  active: boolean;
  onSalePriceChange: (sale: number) => void;
  onToggleActive: () => void;
}) {
  const minSale = +(basePrice + minMarkup).toFixed(2);
  const maxSale = +(basePrice + maxMarkup).toFixed(2);

  function step(delta: number) {
    const nextMarkup = Math.min(maxMarkup, Math.max(minMarkup, +(markup + delta).toFixed(2)));
    onSalePriceChange(+(basePrice + nextMarkup).toFixed(2));
  }

  return (
    <div className="catalogue-price-panel rounded-xl p-3">
      <p className="catalogue-price-label mb-2 text-[10px] font-bold uppercase tracking-wide">
        Sell at
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="catalogue-step-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          onClick={() => step(-0.5)}
          aria-label="Decrease price"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          type="number"
          min={minSale}
          max={maxSale}
          step={0.5}
          value={salePrice}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (!Number.isFinite(next)) return;
            onSalePriceChange(Math.min(maxSale, Math.max(minSale, next)));
          }}
          className="catalogue-price-input num h-9 min-w-0 flex-1 rounded-lg px-2 text-center text-sm font-bold"
        />
        <button
          type="button"
          className="catalogue-step-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          onClick={() => step(0.5)}
          aria-label="Increase price"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="catalogue-markup-hint mt-2 text-[11px]">
        +{formatGHS(markup)} markup on {formatGHS(basePrice)} base
      </p>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
        <p className="catalogue-earn text-xs font-bold">
          You earn {formatGHS(earnAmount)}
        </p>
        <button
          type="button"
          onClick={onToggleActive}
          className={cn(
            "catalogue-visibility-btn inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold",
            active ? "is-visible" : "is-hidden",
          )}
          title={active ? "Visible on storefront" : "Hidden from storefront"}
        >
          {active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {active ? "Visible" : "Hidden"}
        </button>
      </div>
    </div>
  );
}
