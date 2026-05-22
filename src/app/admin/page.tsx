import Link from "next/link";
import {
  ArrowUpRight,
  DollarSign,
  Headphones,
  ShoppingCart,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { WholesaleOverviewMini } from "@/components/wholesale/wholesale-overview-mini";
import { StatCard } from "@/components/ui/stat-card";
import {
  fetchAdminOverview,
  fetchAdminTopCustomers,
  fetchAdminVendors,
} from "@/lib/data/admin-queries";
import { fetchAdminAgentOpsSummary } from "@/lib/data/admin-agent-ops";
import { fetchWholesaleCatalogue } from "@/lib/data/wholesale";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { formatGHS, formatCompact } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="panel p-8 text-center text-white/60">
        Database not configured. Add Supabase env vars to load admin data.
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
    <div className="space-y-6">
      {/* Hero */}
      <section className="panel-solid panel-ribbon relative overflow-hidden p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(212, 175, 55, 0.18), transparent)",
          }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="chip chip-gold inline-flex">
              <Sparkles className="h-3 w-3" />
              Command Center
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl">
              <span className="text-vault-aurora">Platform pulse</span>
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-white/60">
              Real-time view of GMV, vendor health, and operations queue across every
              DCS Elite agent and storefront.
            </p>
          </div>
          {pendingVendors.length > 0 && (
            <Link
              href="/admin/vendors"
              className="chip chip-amber inline-flex hover:brightness-110"
            >
              <span className="dot dot-amber dot-pulse" />
              {pendingVendors.length} vendor{pendingVendors.length === 1 ? "" : "s"} pending
            </Link>
          )}
        </div>
      </section>

      {/* Top KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="GMV (30d)"
          value={formatGHS(metrics?.gmv30d ?? 0)}
          icon={DollarSign}
          tone="gold"
        />
        <StatCard
          label="Platform revenue"
          value={formatGHS(metrics?.platformRevenue30d ?? 0)}
          icon={DollarSign}
          tone="emerald"
        />
        <StatCard
          label="Orders today"
          value={formatCompact(metrics?.ordersToday ?? 0)}
          icon={ShoppingCart}
        />
        <StatCard
          label="Active vendors"
          value={String(metrics?.activeVendors ?? 0)}
          icon={Store}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <WholesaleOverviewMini wholesale={wholesale} variant="admin" />
        </div>

        <div className="space-y-4 lg:col-span-2">
          {/* Vendor governance */}
          <section className="panel p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="eyebrow-section flex-1">
                <Users className="h-3 w-3" />
                Vendor governance
              </p>
              <Link
                href="/admin/vendors"
                className="text-[10px] font-bold uppercase tracking-wider text-gold hover:underline"
              >
                View all <ArrowUpRight className="ml-0.5 inline h-3 w-3" />
              </Link>
            </div>
            {topByOrders.length === 0 ? (
              <p className="mt-4 text-sm text-white/55">No vendors yet.</p>
            ) : (
              <ul className="mt-4 divide-vault overflow-hidden">
                {topByOrders.map((v) => (
                  <li
                    key={v.id}
                    className="row-hover flex items-center justify-between gap-2 py-2.5 text-sm"
                  >
                    <span className="truncate font-medium text-white">{v.business_name}</span>
                    <Badge variant={v.status === "approved" ? "success" : "warning"}>
                      {v.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            {pendingVendors.length > 0 && (
              <p className="mt-3 text-xs text-amber-300">
                {pendingVendors.length} vendor{pendingVendors.length === 1 ? "" : "s"} awaiting approval
              </p>
            )}
          </section>

          {/* Agent operations */}
          <section className={opsTotal > 0 ? "panel-rose p-5" : "panel p-5"}>
            <div className="flex items-center justify-between gap-2">
              <p className="eyebrow-section flex-1">
                <Headphones className="h-3 w-3" />
                Agent operations
              </p>
              <Link
                href="/admin/agent-ops"
                className="text-[10px] font-bold uppercase tracking-wider text-gold hover:underline"
              >
                Manage <ArrowUpRight className="ml-0.5 inline h-3 w-3" />
              </Link>
            </div>
            <ul className="mt-4 divide-vault">
              <OpsRow label="Pending reward payouts" value={agentOps.pendingWithdrawals} />
              <OpsRow label="Open complaints" value={agentOps.openComplaints} />
              <OpsRow label="MTN AFA pending" value={agentOps.pendingMtnAfa} />
              <OpsRow label="Active ClaimIt codes" value={agentOps.activePromoCodes} tone="muted" />
            </ul>
          </section>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <p className="eyebrow-section">Payment performance</p>
          <div className="mt-5 space-y-4">
            <MetricBar label="Success rate" value={metrics?.successRate ?? 0} tone="emerald" />
            <MetricBar label="Paystack share" value={metrics?.paystackShare ?? 100} tone="gold" />
          </div>
        </section>

        <section className="panel overflow-hidden">
          <div className="px-5 pt-5">
            <p className="eyebrow-section">Top customers</p>
          </div>
          {topCustomers.length === 0 ? (
            <p className="px-5 py-6 text-sm text-white/55">
              No customer orders recorded yet.
            </p>
          ) : (
            <div className="mt-3 max-h-72 overflow-y-auto px-2 pb-2">
              <table className="table-dark">
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
                      <td className="font-medium text-white">{c.name}</td>
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
    <li className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-white/55">{label}</span>
      <span
        className={
          tone === "muted"
            ? "metric metric-sm text-white/70"
            : value > 0
              ? "metric metric-sm text-amber-300"
              : "metric metric-sm text-emerald-300"
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
      ? "from-emerald-400 to-emerald-300"
      : "from-gold to-gold-glow";
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="font-bold tabular-nums text-white">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
