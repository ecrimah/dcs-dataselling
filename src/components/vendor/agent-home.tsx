"use client";

import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  FileSpreadsheet,
  FileText,
  Home,
  Monitor,
  Plus,
  ShoppingCart,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { VendorRecentOrder, VendorTodayStats } from "@/lib/data/vendor-agent";
import { BULK_SAMPLE_CSV } from "@/lib/wholesale/bulk-sample";
import { formatGHS, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";

const NETWORK_TILES = [
  { id: "mtn", label: "MTN", href: "/vendor/dashboard/wholesale?network=mtn", color: "#FFCC00", short: "MTN" },
  {
    id: "telecel",
    label: "TELECEL",
    href: "/vendor/dashboard/wholesale?network=telecel",
    color: "#E4002B",
    short: "TEL",
  },
  {
    id: "at-ishare",
    label: "AT - iShare",
    href: "/vendor/dashboard/wholesale?network=at&line=ishare",
    color: "#0066CC",
    short: "AT",
  },
  {
    id: "at-bigtime",
    label: "AT - BigTime",
    href: "/vendor/dashboard/wholesale?network=at&line=bigtime",
    color: "#0066CC",
    short: "AT",
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
  const firstName = vendorName.split(" ")[0];

  return (
    <div className="space-y-5 p-4 lg:mx-auto lg:max-w-4xl lg:p-6">
      {/* Greeting */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-white/55">
            {greeting},{" "}
            <span className="font-bold text-white">{firstName}</span>
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-white sm:text-3xl">
            Welcome back to your <span className="text-vault-aurora">terminal</span>
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="chip chip-emerald">
              <span className="dot dot-emerald dot-pulse" />
              Live · 24/7
            </span>
            <span className="chip chip-gold">
              <Sparkles className="h-3 w-3" />
              {vendorName}
            </span>
          </div>
        </div>
      </header>

      {/* Wallet hero */}
      <section className="panel-solid panel-ribbon relative overflow-hidden p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(212, 175, 55, 0.22), transparent)",
          }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow-section flex-1">
              <Wallet className="h-3 w-3" />
              Wallet balance
            </p>
            <p className="metric metric-xl mt-2 text-vault-aurora">
              {formatGHS(balance)}
            </p>
            <p className="mt-1 text-xs text-white/55">Available to spend on orders</p>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <Link
            href="/vendor/dashboard/wholesale?topup=1"
            className="btn btn-gold w-full py-2.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Top Up
          </Link>
          <Link
            href="/vendor/dashboard/claim"
            className="btn btn-emerald w-full py-2.5"
          >
            ClaimIt
          </Link>
          <Link
            href="/vendor/dashboard/wallet"
            className="btn btn-ghost w-full py-2.5"
          >
            History
          </Link>
        </div>
      </section>

      {/* Place order */}
      <section>
        <p className="eyebrow-section mb-3">Place order</p>
        <div className="grid grid-cols-2 gap-2">
          {NETWORK_TILES.map((tile) => (
            <Link
              key={tile.id}
              href={tile.href}
              className="panel group flex items-center gap-3 p-3 transition hover:bg-white/[0.04]"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-[10px] font-black shadow-lg"
                style={{
                  backgroundColor: tile.color,
                  color: tile.id === "mtn" ? "#111" : "#fff",
                }}
              >
                {tile.short}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{tile.label}</p>
                <p className="text-[10px] text-white/40">Browse bundles →</p>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-white/30 transition group-hover:text-gold" />
            </Link>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Link
            href="/vendor/dashboard/wholesale?mode=bulk"
            className="btn btn-emerald w-full py-2.5"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel
          </Link>
          <Link
            href="/vendor/dashboard/wholesale?mode=bulk"
            className="btn btn-gold w-full py-2.5"
          >
            <FileText className="h-3.5 w-3.5" />
            Bulk
          </Link>
          <button type="button" onClick={downloadSample} className="btn btn-ghost w-full py-2.5">
            <Monitor className="h-3.5 w-3.5" />
            Sample
          </button>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <p className="eyebrow-section mb-3">Quick actions</p>
        <Link
          href="/vendor/dashboard/storefront"
          className="panel-gold mb-2 flex items-center gap-3 p-3 transition hover:brightness-110"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15">
            <Home className="h-5 w-5 text-gold" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white">Manage your storefront</p>
            <p className="text-xs text-white/55">Branding, links, and customer view</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-gold" />
        </Link>
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              href: "/vendor/dashboard/wholesale",
              label: "New Order",
              icon: Plus,
              chip: "chip-emerald",
            },
            {
              href: "/vendor/dashboard/wholesale?mode=bulk",
              label: "Bulk",
              icon: Monitor,
              chip: "chip-sky",
            },
            {
              href: "/vendor/dashboard/orders",
              label: "Orders",
              icon: FileText,
              chip: "chip-gold",
            },
            {
              href: "/vendor/dashboard/wallet",
              label: "Activity",
              icon: Activity,
              chip: "chip-violet",
            },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="panel group flex flex-col items-center gap-1.5 px-2 py-3 transition hover:border-gold/30"
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  a.chip,
                )}
              >
                <a.icon className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-white/85">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Overview today */}
      <section>
        <p className="eyebrow-section mb-3">Today</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="panel p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
              Orders
            </p>
            <p className="metric metric-lg mt-1">{today.ordersToday}</p>
          </div>
          <div className="panel p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
              GB sold
            </p>
            <p className="metric metric-lg mt-1">{today.gbSoldToday}</p>
          </div>
          <div className="panel-gold p-4 sm:col-span-1 col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              Revenue
            </p>
            <p className="metric metric-lg mt-1 text-vault-aurora">
              {formatGHS(today.revenueToday)}
            </p>
          </div>
        </div>
      </section>

      {/* Recent orders */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow-section flex-1">Recent orders</p>
          <Link
            href="/vendor/dashboard/orders"
            className="text-[10px] font-bold uppercase tracking-wider text-gold hover:underline"
          >
            View all <ArrowUpRight className="ml-0.5 inline h-3 w-3" />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="panel p-8 text-center text-xs text-white/55">
            No orders yet. Place your first order above.
          </div>
        ) : (
          <ul className="panel divide-vault overflow-hidden">
            {recentOrders.map((o) => (
              <li
                key={o.id}
                className="row-hover flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{o.reference}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/50">
                    <span className="chip chip-muted text-[9px]">{o.network}</span>
                    {formatPhone(o.phone)}
                  </p>
                </div>
                <p className="metric metric-sm shrink-0 text-gold">{formatGHS(o.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href="/vendor/dashboard/wholesale"
        className="btn btn-gold w-full py-3 text-sm lg:hidden"
      >
        <ShoppingCart className="h-4 w-4" />
        Open full buy-data terminal
      </Link>
    </div>
  );
}
