"use client";

import { useMemo, useState } from "react";
import { Minus, Package, Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  AdminDataTable,
  AdminEmptyState,
  AdminTableBody,
  AdminTableHead,
  AdminTh,
} from "@/components/admin";
import type { NetworkId } from "@/lib/constants";
import { NETWORKS } from "@/lib/constants";
import { formatGHS, formatDataAmount } from "@/lib/format";
import { NetworkBadge } from "@/components/marketplace/network-badge";
import { cn } from "@/lib/utils";
import type { WholesaleBundle, VendorListing } from "@/types";

interface Props {
  vendorId: string;
  wholesale: WholesaleBundle[];
  listings: VendorListing[];
  commissionRate: number;
}

type NetworkFilter = "all" | NetworkId;

export function CatalogueEditor({ wholesale, listings: initial, commissionRate }: Props) {
  const [listings, setListings] = useState(initial);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [networkFilter, setNetworkFilter] = useState<NetworkFilter>("all");

  const listingByWholesale = useMemo(() => {
    const map = new Map<string, VendorListing>();
    listings.forEach((l) => map.set(l.wholesaleBundleId, l));
    return map;
  }, [listings]);

  const networkCounts = useMemo(() => {
    const counts: Record<NetworkId, number> = { mtn: 0, telecel: 0, at: 0 };
    for (const row of wholesale) counts[row.network]++;
    return counts;
  }, [wholesale]);

  const filteredBundles = useMemo(() => {
    if (networkFilter === "all") return wholesale;
    return wholesale.filter((w) => w.network === networkFilter);
  }, [wholesale, networkFilter]);

  const inStoreCount = useMemo(
    () => wholesale.filter((w) => listingByWholesale.has(w.id)).length,
    [wholesale, listingByWholesale],
  );

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

  if (wholesale.length === 0) {
    return (
      <AdminEmptyState
        icon={Package}
        title="No bundles available"
        description="Wholesale bundles will appear here once your admin adds them."
      />
    );
  }

  return (
    <div className="pricing-matrix space-y-3">
      <div className="pricing-matrix-filters" role="tablist" aria-label="Filter by network">
        <button
          type="button"
          role="tab"
          aria-selected={networkFilter === "all"}
          className={cn("pricing-matrix-filter-tab", networkFilter === "all" && "is-active")}
          onClick={() => setNetworkFilter("all")}
        >
          All
          <span className="pricing-matrix-filter-count">{wholesale.length}</span>
        </button>
        {NETWORKS.map((network) => (
          <button
            key={network.id}
            type="button"
            role="tab"
            aria-selected={networkFilter === network.id}
            className={cn(
              "pricing-matrix-filter-tab",
              `pricing-matrix-filter-${network.id}`,
              networkFilter === network.id && "is-active",
            )}
            onClick={() => setNetworkFilter(network.id)}
          >
            {network.name}
            <span className="pricing-matrix-filter-count">{networkCounts[network.id]}</span>
          </button>
        ))}
        <span className="pricing-matrix-in-store-pill ml-auto">
          {inStoreCount}/{wholesale.length} in store
        </span>
      </div>

      {filteredBundles.length === 0 ? (
        <AdminEmptyState
          icon={Package}
          title="No bundles for this network"
          description="Switch to another network tab to manage prices."
        />
      ) : (
        <AdminDataTable minWidth="820px">
          <AdminTableHead>
            <AdminTh>Volume</AdminTh>
            <AdminTh>Base</AdminTh>
            <AdminTh>Sell at</AdminTh>
            <AdminTh>Earn</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh className="pricing-matrix-actions-th">Actions</AdminTh>
          </AdminTableHead>
          <AdminTableBody>
            {filteredBundles.map((wb) => {
              const listing = listingByWholesale.get(wb.id);
              const maxMarkup = wb.maxMarkup ?? wb.wholesalePrice * 2;
              return (
                <CatalogueRow
                  key={wb.id}
                  bundle={wb}
                  listing={listing}
                  maxMarkup={maxMarkup}
                  commissionRate={commissionRate}
                  pending={!!pending[wb.id]}
                  onActivate={() => activate(wb)}
                  onMarkupChange={(markup) => listing && updateMarkup(listing, markup)}
                  onToggleActive={() => listing && toggleActive(listing)}
                />
              );
            })}
          </AdminTableBody>
        </AdminDataTable>
      )}

      {listings.length === 0 && (
        <p className="pricing-matrix-tip text-center text-xs">
          Add bundles above to start selling. Most agents start with 3–5 popular ones.
        </p>
      )}
    </div>
  );
}

function CatalogueRow({
  bundle: wb,
  listing,
  maxMarkup,
  commissionRate,
  pending,
  onActivate,
  onMarkupChange,
  onToggleActive,
}: {
  bundle: WholesaleBundle;
  listing?: VendorListing;
  maxMarkup: number;
  commissionRate: number;
  pending: boolean;
  onActivate: () => void;
  onMarkupChange: (markup: number) => void;
  onToggleActive: () => void;
}) {
  const earnAmount = listing ? listing.markupAmount * (1 - commissionRate / 100) : 0;
  const showSuggestedTip =
    listing && wb.suggestedRetail && listing.finalPrice < wb.suggestedRetail;

  return (
    <tr className="admin-table-tr">
      <td className="admin-table-td">
        <div className="flex items-center gap-2">
          <NetworkBadge network={wb.network} size="xs" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="pricing-matrix-volume">{formatDataAmount(wb.dataMb)}</p>
              {wb.popular && (
                <span className="pricing-matrix-status-chip is-on is-popular">Popular</span>
              )}
            </div>
            <p className="pricing-matrix-meta">
              {wb.name} · {wb.validityDays}d
            </p>
            {showSuggestedTip && (
              <p className="pricing-matrix-tip mt-1 flex items-start gap-1">
                <TrendingUp className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                <span>Suggested {formatGHS(wb.suggestedRetail!)} — room to earn more.</span>
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="admin-table-td">
        <span className="pricing-matrix-base">{formatGHS(wb.customerPrice)}</span>
      </td>
      <td className="admin-table-td">
        {listing ? (
          <SellPriceControl
            basePrice={wb.customerPrice}
            salePrice={listing.finalPrice}
            markup={listing.markupAmount}
            minMarkup={wb.minMarkup}
            maxMarkup={maxMarkup}
            onSalePriceChange={(sale) => {
              const markup = Math.min(
                maxMarkup,
                Math.max(wb.minMarkup, sale - wb.customerPrice),
              );
              onMarkupChange(+markup.toFixed(2));
            }}
          />
        ) : (
          <span className="pricing-matrix-meta">—</span>
        )}
      </td>
      <td className="admin-table-td">
        {listing ? (
          <div>
            <p className="pricing-matrix-earn">{formatGHS(earnAmount)}</p>
            <p className="pricing-matrix-markup-hint">
              +{formatGHS(listing.markupAmount)} markup
            </p>
          </div>
        ) : (
          <span className="pricing-matrix-meta">—</span>
        )}
      </td>
      <td className="admin-table-td">
        {listing ? (
          <div className="pricing-matrix-status">
            <button
              type="button"
              onClick={onToggleActive}
              className={cn(
                "pricing-matrix-status-chip",
                listing.active ? "is-on" : "",
              )}
            >
              {listing.active ? "Visible" : "Hidden"}
            </button>
          </div>
        ) : (
          <span className="pricing-matrix-status-chip">Not in store</span>
        )}
      </td>
      <td className="admin-table-td">
        <div className="pricing-matrix-actions">
          {!listing && (
            <button
              type="button"
              onClick={onActivate}
              disabled={pending}
              className="pricing-matrix-save-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold"
            >
              <Plus className="h-3.5 w-3.5" />
              {pending ? "Adding…" : "Add to store"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function SellPriceControl({
  basePrice,
  salePrice,
  markup,
  minMarkup,
  maxMarkup,
  onSalePriceChange,
}: {
  basePrice: number;
  salePrice: number;
  markup: number;
  minMarkup: number;
  maxMarkup: number;
  onSalePriceChange: (sale: number) => void;
}) {
  const minSale = +(basePrice + minMarkup).toFixed(2);
  const maxSale = +(basePrice + maxMarkup).toFixed(2);

  function step(delta: number) {
    const nextMarkup = Math.min(maxMarkup, Math.max(minMarkup, +(markup + delta).toFixed(2)));
    onSalePriceChange(+(basePrice + nextMarkup).toFixed(2));
  }

  return (
    <div className="pricing-matrix-sell-control">
      <button
        type="button"
        className="pricing-matrix-step-btn"
        onClick={() => step(-0.5)}
        aria-label="Decrease price"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <div className="pricing-matrix-price-wrap pricing-matrix-price-wrap--sell">
        <span className="pricing-matrix-currency" aria-hidden>
          ₵
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
          className="pricing-matrix-price-input num"
          aria-label="Sell price"
        />
      </div>
      <button
        type="button"
        className="pricing-matrix-step-btn"
        onClick={() => step(0.5)}
        aria-label="Increase price"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
