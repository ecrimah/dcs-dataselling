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
    <div>
      {/* Hero band */}
      <section className="page-hero page-hero-ribbon">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="brand-strip">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                {greeting}, {firstName}
              </span>
              <h1 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-[28px]">
                Welcome to your <span className="text-amber-300">terminal</span>
              </h1>
              <p className="mt-2 text-sm text-white/80">
                Place orders, manage your wallet, and track every cedi.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Live · 24/7
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-200">
                  {vendorName}
                </span>
              </div>
            </div>

            {/* Wallet card in hero — like the storefront's right-side block */}
            <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-sm sm:w-80">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
                <Wallet className="h-3.5 w-3.5 text-amber-300" />
                Wallet balance
              </div>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-amber-300 sm:text-[34px]">
                {formatGHS(balance)}
              </p>
              <p className="mt-1 text-xs text-white/65">Available to spend on orders</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Link
                  href="/vendor/dashboard/wholesale?topup=1"
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber-300 px-2 py-2 text-[11px] font-bold text-slate-900 transition hover:brightness-105"
                >
                  <Plus className="h-3 w-3" />
                  Top Up
                </Link>
                <Link
                  href="/vendor/dashboard/claim"
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-2 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-600"
                >
                  ClaimIt
                </Link>
                <Link
                  href="/vendor/dashboard/wallet"
                  className="inline-flex items-center justify-center rounded-lg border border-white/25 px-2 py-2 text-[11px] font-bold text-white transition hover:bg-white/10"
                >
                  History
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stat strip overlapping hero */}
      <div className="mx-auto -mt-6 max-w-7xl px-4 sm:-mt-8 sm:px-6 lg:px-8">
        <div className="stat-strip grid grid-cols-2 sm:grid-cols-4">
          <div className="stat-cell">
            <p className="stat-label">Orders today</p>
            <p className="stat-value is-emerald">{today.ordersToday}</p>
          </div>
          <div className="stat-cell">
            <p className="stat-label">GB sold today</p>
            <p className="stat-value">{today.gbSoldToday}</p>
          </div>
          <div className="stat-cell">
            <p className="stat-label">Revenue today</p>
            <p className="stat-value is-gold">{formatGHS(today.revenueToday)}</p>
          </div>
          <div className="stat-cell">
            <p className="stat-label">Wallet</p>
            <p className="stat-value is-gold">{formatGHS(balance)}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Place order */}
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="section-title">Place an order</h2>
              <p className="section-subtitle">Pick a network to browse bundles.</p>
            </div>
            <Link
              href="/vendor/dashboard/wholesale?mode=bulk"
              className="cta cta-ghost text-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Bulk upload
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {NETWORK_TILES.map((tile) => (
              <Link
                key={tile.id}
                href={tile.href}
                className="surface-card group flex items-center gap-3 p-4"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-[11px] font-black shadow-md"
                  style={{
                    backgroundColor: tile.color,
                    color: tile.id === "mtn" ? "#111" : "#fff",
                  }}
                >
                  {tile.short}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">
                    {tile.label}
                  </p>
                  <p className="text-[11px] text-muted">Browse bundles →</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-soft transition group-hover:text-amber-600" />
              </Link>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Link
              href="/vendor/dashboard/wholesale?mode=bulk"
              className="cta cta-emerald w-full"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </Link>
            <Link
              href="/vendor/dashboard/wholesale?mode=bulk"
              className="cta cta-gold w-full"
            >
              <FileText className="h-3.5 w-3.5" />
              Bulk
            </Link>
            <button type="button" onClick={downloadSample} className="cta cta-ghost w-full">
              <Monitor className="h-3.5 w-3.5" />
              Sample
            </button>
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <div className="mb-3">
            <h2 className="section-title">Quick actions</h2>
            <p className="section-subtitle">Everything you need, one tap away.</p>
          </div>

          <Link
            href="/vendor/dashboard/storefront"
            className="surface-card mb-3 flex items-center gap-3 p-4"
            style={{
              background:
                "linear-gradient(135deg, #fff8e1 0%, #fffaf0 60%, #ffffff 100%)",
              borderColor: "rgba(212, 175, 55, 0.45)",
            }}
          >
            <span className="feature-icon feature-icon-gold">
              <Home className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">
                Manage your storefront
              </p>
              <p className="text-xs text-muted">
                Branding, links, and the customer view
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-amber-600" />
          </Link>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                href: "/vendor/dashboard/wholesale",
                label: "New Order",
                icon: Plus,
                iconClass: "feature-icon-emerald",
              },
              {
                href: "/vendor/dashboard/wholesale?mode=bulk",
                label: "Bulk Orders",
                icon: Monitor,
                iconClass: "feature-icon-sky",
              },
              {
                href: "/vendor/dashboard/orders",
                label: "All Orders",
                icon: FileText,
                iconClass: "feature-icon-gold",
              },
              {
                href: "/vendor/dashboard/wallet",
                label: "Activity",
                icon: Activity,
                iconClass: "feature-icon-violet",
              },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="feature-card flex items-center gap-3"
              >
                <span className={`feature-icon ${a.iconClass}`}>
                  <a.icon className="h-4 w-4" />
                </span>
                <span className="truncate text-sm font-bold text-foreground">
                  {a.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent orders */}
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="section-title">Recent orders</h2>
              <p className="section-subtitle">Latest activity from your terminal.</p>
            </div>
            <Link
              href="/vendor/dashboard/orders"
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              View all →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="surface-card p-10 text-center">
              <p className="text-sm font-semibold text-foreground">No orders yet</p>
              <p className="mt-1 text-xs text-muted">
                Place your first order above to see activity here.
              </p>
            </div>
          ) : (
            <div className="surface-card overflow-hidden">
              {recentOrders.map((o) => (
                <div
                  key={o.id}
                  className="row-light"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {o.reference}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                      <span className="pill pill-slate text-[10px]">{o.network}</span>
                      {formatPhone(o.phone)}
                    </p>
                  </div>
                  <p className="bignum bignum-xl shrink-0 text-base is-gold sm:text-lg">
                    {formatGHS(o.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Trust strip — matches storefront feature cards */}
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="feature-card">
            <span className="feature-icon feature-icon-emerald">
              <ShoppingCart className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-foreground">Instant fulfilment</h3>
            <p className="mt-1 text-xs text-muted">
              Orders route to suppliers in seconds. Average delivery under 2 minutes.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon feature-icon-gold">
              <Wallet className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-foreground">Wallet-first</h3>
            <p className="mt-1 text-xs text-muted">
              Top up once, sell all day. Every order debits your wallet instantly.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon feature-icon-violet">
              <Sparkles className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-foreground">Earn rewards</h3>
            <p className="mt-1 text-xs text-muted">
              Hit volume milestones to unlock cashback and tier-based perks.
            </p>
          </div>
        </section>
      </div>

      <Link
        href="/vendor/dashboard/wholesale"
        className="cta cta-gold mx-4 mb-6 flex items-center justify-center gap-2 py-3 text-sm lg:hidden"
      >
        <ShoppingCart className="h-4 w-4" />
        Open full buy-data terminal
      </Link>
    </div>
  );
}
