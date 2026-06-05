"use client";

import { useMemo, useState } from "react";
import { Plus, Minus, Eye, EyeOff, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { NETWORKS } from "@/lib/constants";
import { formatGHS, formatDataAmount } from "@/lib/format";
import { NetworkBadge } from "@/components/marketplace/network-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WholesaleBundle, VendorListing } from "@/types";

interface Props {
  vendorId: string;
  wholesale: WholesaleBundle[];
  listings: VendorListing[];
  commissionRate: number;
}

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
    setListings((ls) =>
      ls.map((l) => (l.id === listing.id ? { ...l, active: !l.active } : l)),
    );
    await fetch(`/api/vendor/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !listing.active }),
    });
  }

  return (
    <div className="space-y-6">
      {NETWORKS.map((network) => {
        const items = wholesale.filter((w) => w.network === network.id);
        if (items.length === 0) return null;
        return (
          <section key={network.id} className="card-elevated overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border bg-slate-50 px-5 py-4">
              <NetworkBadge network={network.id} />
              <h3 className="font-semibold">{network.name} bundles</h3>
              <span className="ml-auto text-xs text-muted">{items.length} available</span>
            </div>
            <ul className="divide-y divide-border">
              {items.map((wb) => {
                const listing = listingByWholesale.get(wb.id);
                return (
                  <li key={wb.id} className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{formatDataAmount(wb.dataMb)}</p>
                        <p className="text-xs text-muted">
                          Valid {wb.validityDays} days · Base {formatGHS(wb.customerPrice)}
                          {wb.popular && " · 🔥 Popular"}
                        </p>
                      </div>
                      {listing ? (
                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                            <SalePriceControl
                              basePrice={wb.customerPrice}
                              salePrice={listing.finalPrice}
                              minMarkup={wb.minMarkup}
                              maxMarkup={wb.maxMarkup ?? wb.wholesalePrice * 2}
                              onSalePriceChange={(sale) => {
                                const max = wb.maxMarkup ?? wb.wholesalePrice * 2;
                                const markup = Math.min(
                                  max,
                                  Math.max(wb.minMarkup, sale - wb.customerPrice),
                                );
                                updateMarkup(listing, +markup.toFixed(2));
                              }}
                            />
                            <MarkupControl
                              value={listing.markupAmount}
                              min={wb.minMarkup}
                              max={wb.maxMarkup ?? wb.wholesalePrice * 2}
                              onChange={(v) => updateMarkup(listing, v)}
                            />
                          </div>
                          <div className="text-right text-sm">
                            <p className="text-[10px] text-muted">Base {formatGHS(wb.customerPrice)}</p>
                            <p className="font-bold">{formatGHS(listing.finalPrice)}</p>
                            <p className="text-[10px] text-success">
                              You earn{" "}
                              {formatGHS(
                                listing.markupAmount * (1 - commissionRate / 100),
                              )}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleActive(listing)}
                            className={cn(
                              "rounded-lg p-2 transition-colors",
                              listing.active
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-slate-100 text-muted",
                            )}
                            title={listing.active ? "Visible" : "Hidden"}
                          >
                            {listing.active ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => activate(wb)}
                          disabled={pending[wb.id]}
                        >
                          {pending[wb.id] ? "Adding..." : "Add to store"}
                        </Button>
                      )}
                    </div>
                    {listing && wb.suggestedRetail && listing.finalPrice < wb.suggestedRetail && (
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-amber-600">
                        <TrendingUp className="h-3 w-3" />
                        Tip: suggested retail is {formatGHS(wb.suggestedRetail)} — you&apos;re leaving
                        money on the table.
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
        <div className="card-elevated p-8 text-center">
          <Badge>Tip</Badge>
          <p className="mt-3 text-sm text-muted">
            Add bundles above to start selling. Most vendors start with 3-5 popular ones.
          </p>
        </div>
      )}
    </div>
  );
}

function SalePriceControl({
  basePrice,
  salePrice,
  minMarkup,
  maxMarkup,
  onSalePriceChange,
}: {
  basePrice: number;
  salePrice: number;
  minMarkup: number;
  maxMarkup: number;
  onSalePriceChange: (sale: number) => void;
}) {
  const minSale = +(basePrice + minMarkup).toFixed(2);
  const maxSale = +(basePrice + maxMarkup).toFixed(2);

  return (
    <label className="flex flex-col items-end gap-0.5 text-right">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        Your price
      </span>
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
        className="h-9 w-24 rounded-lg border border-border bg-white px-2 text-right text-sm font-bold tabular-nums"
      />
    </label>
  );
}

function MarkupControl({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-white p-1">
      <button
        type="button"
        className="rounded-lg p-1.5 hover:bg-slate-100"
        onClick={() => onChange(Math.max(min, +(value - 0.5).toFixed(2)))}
        aria-label="Decrease markup"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[3.5rem] text-center text-xs font-semibold tabular-nums">
        +₵{value.toFixed(2)}
      </span>
      <button
        type="button"
        className="rounded-lg p-1.5 hover:bg-slate-100"
        onClick={() => onChange(Math.min(max, +(value + 0.5).toFixed(2)))}
        aria-label="Increase markup"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
