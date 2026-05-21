"use client";

import Link from "next/link";
import {
  Activity,
  FileSpreadsheet,
  FileText,
  Home,
  Monitor,
  Plus,
  ShoppingCart,
  Store,
  User,
} from "lucide-react";
import type { VendorRecentOrder, VendorTodayStats } from "@/lib/data/vendor-agent";
import { BULK_SAMPLE_CSV } from "@/lib/wholesale/bulk-sample";
import { formatGHS, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";

const NETWORK_TILES = [
  { id: "mtn", label: "MTN", href: "/vendor/dashboard/wholesale?network=mtn", color: "#FFCC00" },
  {
    id: "at-ishare",
    label: "AT - iShare",
    href: "/vendor/dashboard/wholesale?network=at&line=ishare",
    color: "#0066CC",
  },
  {
    id: "telecel",
    label: "TELECEL",
    href: "/vendor/dashboard/wholesale?network=telecel",
    color: "#E4002B",
  },
  {
    id: "at-bigtime",
    label: "AT - BigTime",
    href: "/vendor/dashboard/wholesale?network=at&line=bigtime",
    color: "#0066CC",
  },
] as const;

interface Props {
  greeting: string;
  vendorName: string;
  balance: number;
  today: VendorTodayStats;
  recentOrders: VendorRecentOrder[];
}

function downloadSample() {
  const blob = new Blob([BULK_SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dcs-bulk-sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function AgentHome({ greeting, vendorName, balance, today, recentOrders }: Props) {
  return (
    <div className="space-y-4 px-4 pb-4 pt-3 lg:max-w-3xl lg:rounded-2xl lg:border lg:border-white/10 lg:bg-navy-900/50 lg:p-6">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/55">
            {greeting} <span className="font-bold text-white">{vendorName.split(" ")[0]}</span>
          </p>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Online · 24/7
          </span>
        </div>
        <Link
          href="/vendor/dashboard/profile"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-navy-900"
        >
          <User className="h-5 w-5 text-white/60" />
        </Link>
      </div>

      {/* Wallet card */}
      <section className="rounded-2xl border border-white/10 bg-navy-900 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gold/80">Wallet balance</p>
        <p className="num mt-1 text-3xl font-bold text-white">{formatGHS(balance)}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Link
            href="/vendor/dashboard/wholesale?topup=1"
            className="flex items-center justify-center gap-1 rounded-xl bg-gold py-2.5 text-xs font-bold text-navy-950"
          >
            <Plus className="h-3.5 w-3.5" />
            Top Up
          </Link>
          <Link
            href="/vendor/dashboard/claim"
            className="rounded-xl border border-emerald-500/40 py-2.5 text-center text-xs font-bold text-emerald-400"
          >
            ClaimIt
          </Link>
          <Link
            href="/vendor/dashboard/wallet"
            className="rounded-xl border border-gold/40 py-2.5 text-center text-xs font-bold text-gold"
          >
            History
          </Link>
        </div>
      </section>

      {/* Place order */}
      <section>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Place order</p>
        <div className="grid grid-cols-2 gap-2">
          {NETWORK_TILES.map((tile) => (
            <Link
              key={tile.id}
              href={tile.href}
              className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-navy-900 py-4 transition-colors hover:border-gold/30"
            >
              <span
                className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg text-[10px] font-black"
                style={{ backgroundColor: tile.color, color: tile.id === "mtn" ? "#111" : "#fff" }}
              >
                {tile.label.split(" ")[0].slice(0, 3)}
              </span>
              <span className="text-center text-xs font-bold">{tile.label}</span>
            </Link>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Link
            href="/vendor/dashboard/wholesale?mode=bulk"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-[11px] font-bold text-emerald-400"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel
          </Link>
          <Link
            href="/vendor/dashboard/wholesale?mode=bulk"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gold/30 bg-gold/10 py-2.5 text-[11px] font-bold text-gold"
          >
            <FileText className="h-3.5 w-3.5" />
            Bulk
          </Link>
          <button
            type="button"
            onClick={downloadSample}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 py-2.5 text-[11px] font-bold text-white/70"
          >
            <Monitor className="h-3.5 w-3.5" />
            Sample
          </button>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Quick actions</p>
        <Link
          href="/vendor/dashboard/storefront"
          className="mb-2 flex items-center gap-3 rounded-xl border border-white/10 bg-navy-900 p-3"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15">
            <Home className="h-5 w-5 text-gold" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">Create Store</p>
            <p className="text-xs text-white/45">Launch your storefront</p>
          </div>
          <span className="text-gold">→</span>
        </Link>
        <div className="grid grid-cols-4 gap-2">
          {[
            { href: "/vendor/dashboard/wholesale", label: "New Order", icon: Plus, color: "text-emerald-400 bg-emerald-500/15" },
            { href: "/vendor/dashboard/wholesale?mode=bulk", label: "Bulk", icon: Monitor, color: "text-sky-400 bg-sky-500/15" },
            { href: "/vendor/dashboard/orders", label: "Orders", icon: FileText, color: "text-gold bg-gold/15" },
            { href: "/vendor/dashboard/wallet", label: "Transactions", icon: Activity, color: "text-violet-400 bg-violet-500/15" },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-navy-900 py-3"
            >
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", a.color)}>
                <a.icon className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Overview today */}
      <section>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Overview</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-navy-900 p-4">
            <p className="text-[10px] font-bold uppercase text-white/40">Orders</p>
            <p className="num mt-1 text-3xl font-bold">{today.ordersToday}</p>
            <p className="text-xs text-white/45">Today</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-navy-900 p-4">
            <p className="text-[10px] font-bold uppercase text-white/40">GB sold</p>
            <p className="num mt-1 text-3xl font-bold">{today.gbSoldToday}</p>
            <p className="text-xs text-white/45">Today</p>
          </div>
          <div className="col-span-2 rounded-xl border border-white/10 bg-navy-900 p-4">
            <p className="text-[10px] font-bold uppercase text-white/40">Revenue</p>
            <p className="num mt-1 text-3xl font-bold text-gold">{formatGHS(today.revenueToday)}</p>
            <p className="text-xs text-white/45">Today · store sales</p>
          </div>
        </div>
      </section>

      {/* Recent orders */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Recent orders</p>
          <Link href="/vendor/dashboard/orders" className="text-[11px] font-bold text-gold">
            View all →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="rounded-xl border border-white/10 py-8 text-center text-xs text-white/45">
            No orders yet. Place your first order above.
          </div>
        ) : (
          <ul className="space-y-2">
            {recentOrders.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-navy-900 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{o.reference}</p>
                  <p className="text-xs text-white/45">
                    {formatPhone(o.phone)} · {o.network}
                  </p>
                </div>
                <p className="num shrink-0 text-sm font-bold text-gold">{formatGHS(o.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href="/vendor/dashboard/wholesale"
        className="flex items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-navy-950 lg:hidden"
      >
        <ShoppingCart className="h-4 w-4" />
        Open full buy-data terminal
      </Link>
    </div>
  );
}
