"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Flame, Package, Search, SlidersHorizontal, X } from "lucide-react";
import { NETWORKS, SORT_OPTIONS } from "@/lib/constants";
import { BundleCard } from "@/components/marketplace/bundle-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { Bundle } from "@/types";

interface Props {
  initialBundles: Bundle[];
}

export function MarketplaceContent({ initialBundles }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [network, setNetwork] = useState(searchParams.get("network") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "best_value");
  const [popularOnly, setPopularOnly] = useState(false);

  const syncParams = useCallback(
    (updates: { network?: string; sort?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (updates.network !== undefined) {
        if (updates.network) params.set("network", updates.network);
        else params.delete("network");
      }
      if (updates.sort !== undefined) {
        if (updates.sort && updates.sort !== "best_value") params.set("sort", updates.sort);
        else params.delete("sort");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const bundles = useMemo(() => {
    let items = [...initialBundles];

    if (network) items = items.filter((b) => b.network === network);
    if (popularOnly) items = items.filter((b) => b.popular);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.vendor.businessName.toLowerCase().includes(q),
      );
    }

    switch (sort) {
      case "lowest_price":
        items.sort((a, b) => a.price - b.price);
        break;
      case "fastest":
        items.sort((a, b) => a.vendor.fulfilmentMinutes - b.vendor.fulfilmentMinutes);
        break;
      case "popular":
        items.sort((a, b) => b.salesCount - a.salesCount);
        break;
      default:
        items.sort((a, b) => b.dataMb / b.price - a.dataMb / a.price);
    }

    return items;
  }, [initialBundles, network, sort, popularOnly, search]);

  const hasFilters = Boolean(network || popularOnly || search.trim());

  function clearFilters() {
    setSearch("");
    setNetwork("");
    setPopularOnly(false);
    setSort("best_value");
    syncParams({ network: "", sort: "best_value" });
  }

  function selectNetwork(id: string) {
    setNetwork(id);
    syncParams({ network: id });
  }

  function selectSort(id: string) {
    setSort(id);
    syncParams({ sort: id });
  }

  const networkLabel = network
    ? NETWORKS.find((n) => n.id === network)?.name
    : null;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
      {/* Mobile sticky filters */}
      <div className="sticky top-[4.25rem] z-20 -mx-4 border-b border-border bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <NetworkChip id="" label="All" active={!network} onClick={() => selectNetwork("")} />
          {NETWORKS.map((n) => (
            <NetworkChip
              key={n.id}
              id={n.id}
              label={n.name.split(" ")[0]}
              active={network === n.id}
              onClick={() => selectNetwork(n.id)}
            />
          ))}
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-slate-50 pl-8 pr-3 text-xs focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => selectSort(e.target.value)}
            className="h-9 shrink-0 rounded-lg border border-border bg-slate-50 px-2 text-xs font-medium"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-24 overflow-hidden rounded-2xl border border-border bg-white shadow-[0_12px_40px_rgba(6,9,20,0.08)]">
          <div className="border-b border-border bg-slate-50/80 px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <SlidersHorizontal className="h-4 w-4 text-cyan-600" />
              Refine results
            </div>
          </div>

          <div className="space-y-6 p-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Search
              </label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  placeholder="Bundle or vendor…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-slate-50 pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Network
              </p>
              <div className="mt-2 flex flex-col gap-1.5">
                <NetworkChip id="" label="All networks" active={!network} onClick={() => selectNetwork("")} block />
                {NETWORKS.map((n) => (
                  <NetworkChip
                    key={n.id}
                    id={n.id}
                    label={n.name}
                    active={network === n.id}
                    onClick={() => selectNetwork(n.id)}
                    block
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Sort by</p>
              <div className="mt-2 flex flex-col gap-1">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => selectSort(o.id)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                      sort === o.id
                        ? "bg-navy-900 text-white"
                        : "text-muted hover:bg-slate-100 hover:text-foreground",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-slate-50/80 px-3 py-2.5">
              <input
                type="checkbox"
                checked={popularOnly}
                onChange={(e) => setPopularOnly(e.target.checked)}
                className="rounded border-border text-cyan-600 focus:ring-cyan-500"
              />
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                Hot deals only
              </span>
            </label>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-semibold text-muted transition-colors hover:border-cyan-500/40 hover:text-cyan-700"
              >
                <X className="h-3.5 w-3.5" />
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Results */}
      <div className="min-w-0 flex-1">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold tracking-tight text-foreground">
              {bundles.length} bundle{bundles.length !== 1 ? "s" : ""}
              {networkLabel && (
                <span className="font-semibold text-muted"> · {networkLabel}</span>
              )}
            </p>
            {hasFilters && (
              <div className="mt-2 flex flex-wrap gap-1.5 lg:hidden">
                {networkLabel && (
                  <ActiveFilterPill label={networkLabel} onRemove={() => selectNetwork("")} />
                )}
                {popularOnly && (
                  <ActiveFilterPill label="Hot only" onRemove={() => setPopularOnly(false)} />
                )}
                {search.trim() && (
                  <ActiveFilterPill label={`"${search}"`} onRemove={() => setSearch("")} />
                )}
              </div>
            )}
          </div>
          <p className="hidden text-xs text-muted sm:block">
            Prices include vendor markup · Pay with MoMo
          </p>
        </div>

        {bundles.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No bundles found"
            description="Try another network or clear your filters."
            action={{ label: "Clear filters", href: "/marketplace" }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-3">
            {bundles.map((bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} variant="compact" showVendor />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NetworkChip({
  id,
  label,
  active,
  onClick,
  block,
}: {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
  block?: boolean;
}) {
  const config = id ? NETWORKS.find((n) => n.id === id) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-lg text-xs font-semibold transition-all",
        block ? "w-full px-3 py-2 text-left text-sm" : "px-3 py-1.5",
        active && config
          ? ""
          : active
            ? "bg-navy-900 text-white"
            : "bg-slate-100 text-muted hover:bg-slate-200",
      )}
      style={
        active && config
          ? { backgroundColor: config.color, color: config.textColor }
          : undefined
      }
    >
      {label}
    </button>
  );
}

function ActiveFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-800"
    >
      {label}
      <X className="h-3 w-3" />
    </button>
  );
}
