"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Plus, ShoppingCart, Wallet } from "lucide-react";
import type { NetworkId } from "@/lib/constants";
import { formatDataAmount, formatGHS } from "@/lib/format";
import { NetworkBadge } from "@/components/marketplace/network-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WholesaleBundle } from "@/types";

type NetworkFilter = "all" | NetworkId;
type Variant = "admin" | "vendor";

interface Props {
  wholesale: WholesaleBundle[];
  variant: Variant;
  walletBalance?: number;
}

const NETWORK_PILLS: { id: NetworkFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "mtn", label: "MTN" },
  { id: "telecel", label: "TELECEL" },
  { id: "at", label: "AirtelTigo" },
];

export function WholesaleOverviewMini({ wholesale, variant, walletBalance = 0 }: Props) {
  const [network, setNetwork] = useState<NetworkFilter>("all");
  const isVendor = variant === "vendor";

  const networkCounts = useMemo(() => {
    const counts: Record<string, number> = { all: wholesale.length };
    for (const w of wholesale) {
      counts[w.network] = (counts[w.network] ?? 0) + 1;
    }
    return counts;
  }, [wholesale]);

  const filtered = useMemo(() => {
    if (network === "all") return wholesale;
    return wholesale.filter((w) => w.network === network);
  }, [wholesale, network]);

  const avgPrice =
    wholesale.length > 0
      ? wholesale.reduce((s, w) => s + w.wholesalePrice, 0) / wholesale.length
      : 0;

  const actionHref = isVendor ? "/vendor/dashboard/wholesale" : "/admin/wholesale";
  const actionLabel = isVendor ? "Buy Data" : "Manage";

  return (
    <div className="overflow-hidden rounded-2xl border border-navy-800 bg-navy-950 text-white shadow-lg">
      <div className="flex items-center gap-3 border-b border-white/10 bg-navy-900/95 px-4 py-3">
        {isVendor ? (
          <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/15">
              <Wallet className="h-4 w-4 text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-white/45">
                Wallet balance
              </p>
              <p className="num truncate text-lg font-bold text-gold">
                {formatGHS(walletBalance)}
              </p>
            </div>
            <Link
              href={actionHref}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gold/30 bg-gold/10 px-2 py-1.5 text-[10px] font-bold text-gold hover:bg-gold/20"
            >
              <Plus className="h-3 w-3" />
              Top Up
            </Link>
          </>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-white/45">
                Agent terminal preview
              </p>
              <p className="truncate text-sm font-bold text-gold">
                {wholesale.length} active product{wholesale.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-white/45">
                Avg wholesale
              </p>
              <p className="num text-sm font-bold">{formatGHS(avgPrice)}</p>
            </div>
          </>
        )}
        <Link
          href={actionHref}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gold px-2.5 py-1.5 text-[11px] font-bold text-navy-950 transition-colors hover:bg-gold-glow"
        >
          {actionLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 scrollbar-none">
        {NETWORK_PILLS.map((pill) => (
          <button
            key={pill.id}
            type="button"
            onClick={() => setNetwork(pill.id)}
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors",
              network === pill.id
                ? "bg-white text-navy-950"
                : "bg-white/8 text-white/55 hover:bg-white/12",
            )}
          >
            {pill.label}
            <span className="ml-0.5 opacity-60">({networkCounts[pill.id] ?? 0})</span>
          </button>
        ))}
      </div>

      <p className="px-4 pb-2 text-[10px] text-white/40">
        {filtered.length} product{filtered.length === 1 ? "" : "s"}
        {isVendor ? " · tap Buy Data for cart & checkout" : " · what agents see on Buy Data"}
      </p>

      <div className="max-h-[240px] space-y-2 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-white/10 py-8 text-center text-xs text-white/45">
            No products for this network.
          </div>
        ) : (
          filtered.map((wb) => (
            <Link
              key={wb.id}
              href={actionHref}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-navy-900/70 px-3 py-2.5 transition-colors hover:border-gold/30 hover:bg-navy-900"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1">
                  <NetworkBadge network={wb.network} size="xs" />
                  {wb.popular && (
                    <Badge variant="warning" className="px-1 py-0 text-[8px]">
                      Hot
                    </Badge>
                  )}
                </div>
                <p className="mt-1 truncate text-xs font-bold">{wb.name}</p>
                <p className="text-[10px] text-white/40">
                  {formatDataAmount(wb.dataMb)} · {wb.validityDays}d
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="num text-sm font-bold text-gold">{formatGHS(wb.wholesalePrice)}</p>
                {isVendor && (
                  <p className="mt-0.5 flex items-center justify-end gap-0.5 text-[9px] text-white/35">
                    <ShoppingCart className="h-2.5 w-2.5" />
                    order
                  </p>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
