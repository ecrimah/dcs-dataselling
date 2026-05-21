"use client";

import { useMemo, useState } from "react";
import type { Bundle } from "@/types";
import type { NetworkId } from "@/lib/constants";
import { BundleCard } from "@/components/marketplace/bundle-card";
import { cn } from "@/lib/utils";

interface Props {
  bundles: Bundle[];
}

type FilterId = "all" | NetworkId;

const NETWORK_LABELS: Record<NetworkId, string> = {
  mtn: "MTN",
  telecel: "Telecel",
  at: "AirtelTigo",
};

const NETWORK_DOT: Record<NetworkId, string> = {
  mtn: "bg-amber-400",
  telecel: "bg-red-500",
  at: "bg-red-600",
};

export function StorefrontBundles({ bundles }: Props) {
  const [filter, setFilter] = useState<FilterId>("all");

  const networks = useMemo(() => {
    const set = new Set<NetworkId>();
    for (const b of bundles) set.add(b.network);
    return Array.from(set);
  }, [bundles]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: bundles.length };
    for (const b of bundles) c[b.network] = (c[b.network] ?? 0) + 1;
    return c;
  }, [bundles]);

  const filtered = useMemo(
    () => (filter === "all" ? bundles : bundles.filter((b) => b.network === filter)),
    [bundles, filter],
  );

  if (bundles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white/70 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
          📭
        </div>
        <p className="mt-4 font-semibold text-foreground">No bundles listed yet</p>
        <p className="mt-1 text-sm text-muted">
          This store has not published any bundles. Check back soon.
        </p>
      </div>
    );
  }

  const filters: FilterId[] = ["all", ...networks];

  return (
    <div className="space-y-4">
      {networks.length > 1 && (
        <div className="-mx-1 flex flex-wrap items-center gap-1.5 overflow-x-auto px-1 pb-1">
          {filters.map((id) => {
            const active = filter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  active
                    ? "border-foreground bg-foreground text-white shadow-sm"
                    : "border-border bg-white text-muted hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {id !== "all" && (
                  <span className={cn("h-1.5 w-1.5 rounded-full", NETWORK_DOT[id as NetworkId])} />
                )}
                {id === "all" ? "All" : NETWORK_LABELS[id as NetworkId]}
                <span
                  className={cn(
                    "num rounded px-1 text-[10px]",
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-muted",
                  )}
                >
                  {counts[id] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
        {filtered.map((b) => (
          <BundleCard key={b.id} bundle={b} variant="compact" />
        ))}
      </div>
    </div>
  );
}
