"use client";

import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Crown,
  FileSpreadsheet,
  FileText,
  Flame,
  Monitor,
  Plus,
  ShoppingBag,
  Target,
  Trophy,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import type {
  VendorRecentOrder,
  VendorTodayStats,
} from "@/lib/data/vendor-agent";
import { BULK_SAMPLE_CSV } from "@/lib/wholesale/bulk-sample";
import { formatGHS, formatPhone } from "@/lib/format";
import { CircleProgress } from "@/components/ui/circle-progress";

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

export function AgentHome({
  greeting,
  vendorName,
  balance,
  today,
  recentOrders,
}: Props) {
  const firstName = vendorName.split(" ")[0];

  // Wallet vs target = simple visual cue. If they have ≥ ₵500 balance, ring is "full".
  const walletTarget = Math.max(balance, 500);
  const walletPct = walletTarget > 0 ? Math.min(100, (balance / walletTarget) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
      {/* ===================== WELCOME CARD ===================== */}
      <section className="welcome-card">
        <div className="welcome-chip">
          <span className="chip-badge">Agent</span>
          <span className="live-badge">System fully synced</span>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {greeting}, {firstName} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-500 sm:text-[15px]">
              Your real-time data reselling terminal & wallet center.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/vendor/dashboard/wholesale"
              className="susu-btn-gold"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Buy data
            </Link>
            <Link
              href="/vendor/dashboard/wallet"
              className="susu-btn-ghost"
            >
              My wallet
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== VAULT HERO (wallet w/ ring) ===================== */}
      <section className="vault-hero-card">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1">
            <span className="vault-hero-chip">
              <Wallet className="h-3.5 w-3.5" />
              Wallet vault
            </span>
            <p className="vault-hero-label mt-4">Available balance</p>
            <p className="vault-hero-amount mt-2">{formatGHS(balance)}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="vault-hero-pill-success">
                <Zap className="h-3 w-3" />
                {balance > 0 ? "Ready to sell" : "Top up to start"}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-white/65">
                <span className="font-bold uppercase tracking-[0.14em] text-white/45">
                  Today
                </span>
                <span className="text-white">
                  {today.ordersToday} orders ·{" "}
                  <span className="font-bold text-amber-300">
                    {formatGHS(today.revenueToday)}
                  </span>{" "}
                  revenue
                </span>
              </div>
            </div>
          </div>

          <CircleProgress
            value={walletPct}
            label={`${Math.round(walletPct)}%`}
            caption="LOADED"
            size={160}
          />
        </div>
      </section>

      {/* ===================== 4 STAT TILES ===================== */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          icon={<Crown className="h-5 w-5" />}
          tone="gold"
          label="Today's revenue"
          value={formatGHS(today.revenueToday)}
          hint={`${today.ordersToday} orders today`}
          valueAccent="gold"
        />
        <StatTile
          icon={<Target className="h-5 w-5" />}
          tone="sky"
          label="GB sold today"
          value={String(today.gbSoldToday)}
          hint="Across all networks"
        />
        <StatTile
          icon={<Trophy className="h-5 w-5" />}
          tone="amber"
          label="Lifetime orders"
          value={String(recentOrders.length > 0 ? "Active" : "Get started")}
          hint={recentOrders.length > 0 ? "Building reputation" : "Place your first order"}
        />
        <StatTile
          icon={<Wallet className="h-5 w-5" />}
          tone="violet"
          label="Wallet"
          value={formatGHS(balance)}
          hint="Available to spend"
          valueAccent="gold"
        />
      </section>

      {/* ===================== STATUS BANNER ===================== */}
      {balance > 0 ? (
        <section className="banner-success">
          <span className="banner-icon">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h4>You&apos;re ready to sell.</h4>
            <p>
              Wallet loaded with {formatGHS(balance)}. Start placing orders and
              earn commission instantly.
            </p>
          </div>
        </section>
      ) : (
        <section className="banner-info">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-200 text-blue-900">
            <Wallet className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h4 className="font-bold text-blue-900">Top up to start selling.</h4>
            <p className="text-xs text-blue-800">
              Add money to your wallet using MoMo, card, or bank — orders deduct
              instantly.
            </p>
          </div>
          <Link
            href="/vendor/dashboard/wallet"
            className="ml-auto susu-btn-gold shrink-0"
          >
            Top up
          </Link>
        </section>
      )}

      {/* ===================== 3 MINI STATS ===================== */}
      <section className="grid grid-cols-3 gap-3 sm:gap-4">
        <MiniTile
          icon={<Wallet className="h-4 w-4" />}
          tone="amber"
          label="Wallet"
          value={formatGHS(balance)}
        />
        <MiniTile
          icon={<Flame className="h-4 w-4" />}
          tone="rose"
          label="Streak"
          value={`${recentOrders.length > 0 ? recentOrders.length : 0}d`}
        />
        <MiniTile
          icon={<Users className="h-4 w-4" />}
          tone="sky"
          label="Networks"
          value="3"
        />
      </section>

      {/* ===================== BUY DATA QUICK LINKS ===================== */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              Place an order
            </h2>
            <p className="text-sm text-slate-500">
              Pick a network and start selling immediately.
            </p>
          </div>
          <Link
            href="/vendor/dashboard/wholesale?mode=bulk"
            className="susu-btn-ghost"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Bulk upload
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <NetworkLink
            href="/vendor/dashboard/wholesale?network=mtn"
            label="MTN"
            color="#FFCC00"
            textColor="#111"
          />
          <NetworkLink
            href="/vendor/dashboard/wholesale?network=telecel"
            label="Telecel"
            color="#E4002B"
            textColor="#fff"
          />
          <NetworkLink
            href="/vendor/dashboard/wholesale?network=at&line=ishare"
            label="AT iShare"
            color="#0066CC"
            textColor="#fff"
          />
          <NetworkLink
            href="/vendor/dashboard/wholesale?network=at&line=bigtime"
            label="AT BigTime"
            color="#0066CC"
            textColor="#fff"
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <Link
            href="/vendor/dashboard/wholesale?mode=bulk"
            className="susu-btn-dark"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel
          </Link>
          <Link
            href="/vendor/dashboard/wholesale?mode=bulk"
            className="susu-btn-gold"
          >
            <FileText className="h-3.5 w-3.5" />
            Bulk
          </Link>
          <button
            type="button"
            onClick={downloadSample}
            className="susu-btn-ghost"
          >
            <Monitor className="h-3.5 w-3.5" />
            Sample
          </button>
        </div>
      </section>

      {/* ===================== RECENT ACTIVITY / PORTFOLIO ===================== */}
      <section>
        <div className="section-card-header">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              Recent activity
            </h2>
            <p className="text-sm text-slate-500">
              Latest orders from your terminal.
            </p>
          </div>
          <Link
            href="/vendor/dashboard/orders"
            className="susu-btn-ghost"
          >
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="section-card text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Activity className="h-5 w-5 text-slate-400" />
            </div>
            <p className="mt-3 font-bold text-slate-900">No orders yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Place your first order above to start building your reputation.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {recentOrders.slice(0, 4).map((o) => (
              <div key={o.id} className="section-card">
                <div className="section-card-header">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="tile-icon-gold flex h-10 w-10 items-center justify-center rounded-xl">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {o.reference}
                      </p>
                      <p className="text-xs text-slate-500">
                        {o.network} · {formatPhone(o.phone)}
                      </p>
                    </div>
                  </div>
                  <span className="susu-pill susu-pill-active">
                    <span className="dot" />
                    Done
                  </span>
                </div>
                <div className="substat-row">
                  <div className="substat">
                    <p className="substat-label">Amount</p>
                    <p className="substat-value">{formatGHS(o.amount)}</p>
                  </div>
                  <div className="substat">
                    <p className="substat-label">Network</p>
                    <p className="substat-value">{o.network}</p>
                  </div>
                  <div className="substat">
                    <p className="substat-label">Status</p>
                    <p className="substat-value text-emerald-700">Sent</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ============================================================
// Subcomponents
// ============================================================

function StatTile({
  icon,
  tone,
  label,
  value,
  hint,
  valueAccent,
}: {
  icon: React.ReactNode;
  tone: "gold" | "amber" | "sky" | "violet" | "emerald" | "rose";
  label: string;
  value: string;
  hint?: string;
  valueAccent?: "gold" | "emerald" | "rose";
}) {
  return (
    <div className="stat-tile">
      <div className={`stat-tile-icon tile-icon-${tone}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="stat-tile-label">{label}</p>
        <p
          className={`stat-tile-value ${
            valueAccent ? `is-${valueAccent}` : ""
          }`}
        >
          {value}
        </p>
        {hint && <p className="stat-tile-hint">{hint}</p>}
      </div>
    </div>
  );
}

function MiniTile({
  icon,
  tone,
  label,
  value,
}: {
  icon: React.ReactNode;
  tone: "amber" | "rose" | "sky" | "emerald" | "violet" | "gold" | "slate";
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-2xl border bg-white p-3 sm:p-4"
      style={{
        borderColor:
          tone === "amber"
            ? "#fde68a"
            : tone === "rose"
              ? "#fecaca"
              : tone === "sky"
                ? "#bfdbfe"
                : "#e5e7eb",
      }}
    >
      <div className="flex items-center gap-2">
        <div className={`stat-tile-icon tile-icon-${tone} !h-9 !w-9`}>{icon}</div>
        <div>
          <p className="stat-tile-label text-[10px]">{label}</p>
          <p className="text-base font-extrabold leading-none text-slate-900 sm:text-lg">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function NetworkLink({
  href,
  label,
  color,
  textColor,
}: {
  href: string;
  label: string;
  color: string;
  textColor: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_8px_24px_rgba(10,46,93,0.08)]"
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl text-[10px] font-black shadow-md"
        style={{ backgroundColor: color, color: textColor }}
      >
        {label.slice(0, 3).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">{label}</p>
        <p className="text-[11px] text-slate-500">Browse bundles →</p>
      </div>
    </Link>
  );
}
