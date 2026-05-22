import Link from "next/link";
import {
  ArrowUpRight,
  DollarSign,
  Headphones,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Users,
  Zap,
} from "lucide-react";
import { WholesaleOverviewMini } from "@/components/wholesale/wholesale-overview-mini";
import {
  fetchAdminOverview,
  fetchAdminTopCustomers,
  fetchAdminVendors,
} from "@/lib/data/admin-queries";
import { fetchAdminAgentOpsSummary } from "@/lib/data/admin-agent-ops";
import { fetchWholesaleCatalogue } from "@/lib/data/wholesale";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { formatGHS, formatCompact } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="surface-card p-8 text-center">
          <p className="text-sm font-semibold text-foreground">
            Database not configured
          </p>
          <p className="mt-1 text-xs text-muted">
            Add Supabase env vars to load admin data.
          </p>
        </div>
      </div>
    );
  }

  const [metrics, vendors, topCustomers, wholesale, agentOps] = await Promise.all([
    fetchAdminOverview(),
    fetchAdminVendors(),
    fetchAdminTopCustomers(5),
    fetchWholesaleCatalogue(),
    fetchAdminAgentOpsSummary(),
  ]);

  const pendingVendors = vendors.filter((v) => v.status === "pending");
  const topByOrders = [...vendors]
    .sort((a, b) => b.total_orders - a.total_orders)
    .slice(0, 4);

  const opsTotal =
    agentOps.pendingWithdrawals +
    agentOps.openComplaints +
    agentOps.pendingMtnAfa;

  return (
    <div>
      {/* Hero */}
      <section className="page-hero page-hero-ribbon">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="brand-strip">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Command Center
              </span>
              <h1 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-[28px]">
                Platform <span className="text-amber-300">pulse</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                Real-time view of GMV, vendor health, and the operations queue
                across every DCS Elite agent and storefront.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  All systems operational
                </span>
                {pendingVendors.length > 0 && (
                  <Link
                    href="/admin/vendors"
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-200 transition hover:bg-amber-500/25"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                    {pendingVendors.length} vendor{pendingVendors.length === 1 ? "" : "s"} pending
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <div className="mx-auto -mt-6 max-w-7xl px-4 sm:-mt-8 sm:px-6 lg:px-8">
        <div className="stat-strip grid grid-cols-2 sm:grid-cols-4">
          <div className="stat-cell">
            <p className="stat-label">GMV (30d)</p>
            <p className="stat-value is-gold">{formatGHS(metrics?.gmv30d ?? 0)}</p>
          </div>
          <div className="stat-cell">
            <p className="stat-label">Platform revenue</p>
            <p className="stat-value is-emerald">
              {formatGHS(metrics?.platformRevenue30d ?? 0)}
            </p>
          </div>
          <div className="stat-cell">
            <p className="stat-label">Orders today</p>
            <p className="stat-value">{formatCompact(metrics?.ordersToday ?? 0)}</p>
          </div>
          <div className="stat-cell">
            <p className="stat-label">Active vendors</p>
            <p className="stat-value">{metrics?.activeVendors ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick KPI cards row */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiPill
            icon={<DollarSign className="h-4 w-4" />}
            label="GMV (30d)"
            value={formatGHS(metrics?.gmv30d ?? 0)}
            iconClass="feature-icon-gold"
          />
          <KpiPill
            icon={<DollarSign className="h-4 w-4" />}
            label="Platform revenue"
            value={formatGHS(metrics?.platformRevenue30d ?? 0)}
            iconClass="feature-icon-emerald"
          />
          <KpiPill
            icon={<ShoppingCart className="h-4 w-4" />}
            label="Orders today"
            value={formatCompact(metrics?.ordersToday ?? 0)}
            iconClass="feature-icon-sky"
          />
          <KpiPill
            icon={<Store className="h-4 w-4" />}
            label="Active vendors"
            value={String(metrics?.activeVendors ?? 0)}
            iconClass="feature-icon-violet"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <WholesaleOverviewMini wholesale={wholesale} variant="admin" />
          </div>

          <div className="space-y-4 lg:col-span-2">
            {/* Vendor governance */}
            <section className="surface-card p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="eyebrow-light">
                  <Users className="h-3 w-3" />
                  Vendor governance
                </p>
                <Link
                  href="/admin/vendors"
                  className="text-[10px] font-bold uppercase tracking-wider text-amber-700 hover:underline"
                >
                  View all <ArrowUpRight className="ml-0.5 inline h-3 w-3" />
                </Link>
              </div>
              {topByOrders.length === 0 ? (
                <p className="text-sm text-muted">No vendors yet.</p>
              ) : (
                <ul className="-mx-5 divide-y divide-border">
                  {topByOrders.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center justify-between gap-2 px-5 py-2.5 text-sm transition hover:bg-slate-50"
                    >
                      <span className="truncate font-medium text-foreground">
                        {v.business_name}
                      </span>
                      <span
                        className={
                          v.status === "approved"
                            ? "pill pill-emerald text-[10px]"
                            : "pill pill-amber text-[10px]"
                        }
                      >
                        {v.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {pendingVendors.length > 0 && (
                <p className="mt-3 text-xs font-semibold text-amber-700">
                  {pendingVendors.length} vendor
                  {pendingVendors.length === 1 ? "" : "s"} awaiting approval
                </p>
              )}
            </section>

            {/* Agent operations */}
            <section
              className={
                opsTotal > 0
                  ? "surface-card p-5"
                  : "surface-card p-5"
              }
              style={
                opsTotal > 0
                  ? {
                      borderColor: "#fecaca",
                      background:
                        "linear-gradient(135deg, #fff5f5 0%, #fff 80%)",
                    }
                  : undefined
              }
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="eyebrow-light">
                  <Headphones className="h-3 w-3" />
                  Agent operations
                </p>
                <Link
                  href="/admin/agent-ops"
                  className="text-[10px] font-bold uppercase tracking-wider text-amber-700 hover:underline"
                >
                  Manage <ArrowUpRight className="ml-0.5 inline h-3 w-3" />
                </Link>
              </div>
              <ul className="-mx-5 divide-y divide-border">
                <OpsRow
                  label="Pending reward payouts"
                  value={agentOps.pendingWithdrawals}
                />
                <OpsRow
                  label="Open complaints"
                  value={agentOps.openComplaints}
                />
                <OpsRow label="MTN AFA pending" value={agentOps.pendingMtnAfa} />
                <OpsRow
                  label="Active ClaimIt codes"
                  value={agentOps.activePromoCodes}
                  tone="muted"
                />
              </ul>
            </section>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="surface-card p-5">
            <p className="eyebrow-light">Payment performance</p>
            <div className="mt-5 space-y-4">
              <MetricBar
                label="Success rate"
                value={metrics?.successRate ?? 0}
                tone="emerald"
              />
              <MetricBar
                label="Paystack share"
                value={metrics?.paystackShare ?? 100}
                tone="gold"
              />
            </div>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="px-5 pt-5">
              <p className="eyebrow-light">Top customers</p>
            </div>
            {topCustomers.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">
                No customer orders recorded yet.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="table-light">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th className="text-right">Orders</th>
                      <th className="text-right">Spend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((c) => (
                      <tr key={c.userId}>
                        <td className="font-medium">{c.name}</td>
                        <td className="text-right tabular-nums">{c.orders}</td>
                        <td className="text-right font-semibold tabular-nums">
                          {formatGHS(c.spend)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Trust strip */}
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="feature-card">
            <span className="feature-icon feature-icon-emerald">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-foreground">
              Settlement security
            </h3>
            <p className="mt-1 text-xs text-muted">
              All payments flow through Paystack with audited reconciliation
              twice daily.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon feature-icon-sky">
              <Zap className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-foreground">
              Sub-2-minute fulfilment
            </h3>
            <p className="mt-1 text-xs text-muted">
              Skanka5 + manual ops keep MTN, Telecel and AT routes hot 24/7.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon feature-icon-violet">
              <Sparkles className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-foreground">
              Vendor incentives
            </h3>
            <p className="mt-1 text-xs text-muted">
              Tier rewards and ClaimIt codes drive volume to top performers.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiPill({
  icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconClass: string;
}) {
  return (
    <div className="surface-card flex items-center gap-3 p-4">
      <span className={`feature-icon ${iconClass}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
        <p className="bignum bignum-xl mt-0.5 text-base text-foreground sm:text-lg">
          {value}
        </p>
      </div>
    </div>
  );
}

function OpsRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "muted";
}) {
  return (
    <li className="flex items-center justify-between px-5 py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      <span
        className={
          tone === "muted"
            ? "bignum text-base text-muted"
            : value > 0
              ? "bignum text-base text-amber-700"
              : "bignum text-base is-emerald"
        }
      >
        {value}
      </span>
    </li>
  );
}

function MetricBar({
  label,
  value,
  tone = "gold",
}: {
  label: string;
  value: number;
  tone?: "gold" | "emerald";
}) {
  const barGradient =
    tone === "emerald"
      ? "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
      : "linear-gradient(90deg, #d4af37 0%, #f4d160 100%)";
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-bold tabular-nums text-foreground">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(100, value)}%`,
            background: barGradient,
          }}
        />
      </div>
    </div>
  );
}
