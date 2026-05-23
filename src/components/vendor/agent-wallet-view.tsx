"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import type { VendorWalletMetrics, WalletLedgerRow } from "@/lib/data/vendor-agent";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  metrics: VendorWalletMetrics;
  ledger: WalletLedgerRow[];
}

export function AgentWalletView({ metrics, ledger }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    return ledger.filter((e) => {
      if (typeFilter !== "all" && e.entryType !== typeFilter) return false;
      if (search && !(e.reference ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [ledger, search, typeFilter]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Transactions</h2>
          <p className="text-sm text-muted">{ledger.length} total transactions</p>
        </div>
        <a
          href="/api/vendor/wallet/export"
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/50 bg-white px-3 py-2 text-xs font-bold text-amber-700 shadow-sm transition hover:border-amber-500 hover:bg-amber-50"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[
          { label: "Wallet balance", value: formatGHS(metrics.balance), accent: true },
          { label: "Topups today", value: formatGHS(metrics.topupsToday) },
          { label: "Profit today", value: formatGHS(metrics.profitToday) },
          { label: "Lifetime profit", value: formatGHS(metrics.lifetimeProfit) },
          { label: "Sales today", value: formatGHS(metrics.salesToday) },
          { label: "Lifetime sales", value: formatGHS(metrics.lifetimeSales) },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-white/10 bg-navy-900 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wide text-white/40">{c.label}</p>
            <p className={cn("num mt-1 text-lg font-bold", c.accent && "text-gold")}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            type="search"
            placeholder="Search transaction code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-navy-900 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-navy-900 px-3 py-2.5 text-sm text-white focus:outline-none"
        >
          <option value="all">All types</option>
          <option value="topup">Top-up</option>
          <option value="order_debit">Order debit</option>
          <option value="refund">Refund</option>
          <option value="adjustment">Adjustment</option>
        </select>
      </div>

      <ul className="space-y-2">
        {filtered.length === 0 ? (
          <li className="rounded-xl border border-white/10 py-10 text-center text-sm text-white/45">
            No transactions match your filters.
          </li>
        ) : (
          filtered.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-navy-900 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold capitalize">{e.entryType.replace("_", " ")}</p>
                <p className="text-xs text-white/45">
                  {e.reference ?? "—"} · {new Date(e.createdAt).toLocaleString()}
                </p>
                {e.note && <p className="text-[10px] text-white/35">{e.note}</p>}
              </div>
              <p
                className={cn(
                  "num shrink-0 text-sm font-bold",
                  e.amount >= 0 ? "text-emerald-400" : "text-red-400",
                )}
              >
                {e.amount >= 0 ? "+" : ""}
                {formatGHS(e.amount)}
              </p>
            </li>
          ))
        )}
      </ul>

      <p className="text-center text-xs text-muted">
        Need to top up?{" "}
        <Link href="/vendor/dashboard/wholesale" className="font-bold text-amber-700">
          Buy Data →
        </Link>
      </p>
    </div>
  );
}
