import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Headphones,
  ShieldCheck,
  ShoppingCart,
  Store,
  Trophy,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { WholesaleOverviewMini } from "@/components/wholesale/wholesale-overview-mini";
import { CircleProgress } from "@/components/ui/circle-progress";
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
        <div className="section-card text-center">
          <p className="text-sm font-semibold text-slate-900">
            Database not configured
          </p>
          <p className="mt-1 text-xs text-slate-500">
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
    .slice(0, 5);

  const opsTotal =
    agentOps.pendingWithdrawals +
    agentOps.openComplaints +
    agentOps.pendingMtnAfa;

  const successRate = metrics?.successRate ?? 0;
  const paystackShare = metrics?.paystackShare ?? 100;

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
      {/* ===================== WELCOME ===================== */}
      <section className="welcome-card">
        <div className="welcome-chip">
          <span className="chip-badge">Super admin</span>
          <span className="live-badge">All systems operational</span>
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back, Admin 👋
            </h1>
            <p className="mt-1 text-sm text-slate-500 sm:text-[15px]">
              Your real-time view of GMV, vendor health, and the operations queue.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/operations" className="susu-btn-gold">
              Run reconciliation
            </Link>
            <Link href="/admin/vendors" className="susu-btn-ghost">
              Manage vendors
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== VAULT HERO (GMV w/ ring) ===================== */}
      <section className="vault-hero-card">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1">
            <span className="vault-hero-chip">
              <DollarSign className="h-3.5 w-3.5" />
              Platform vault
            </span>
            <p className="vault-hero-label mt-4">Gross Merchandise Volume (30d)</p>
            <p className="vault-hero-amount mt-2">
              {formatGHS(metrics?.gmv30d ?? 0)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="vault-hero-pill-success">
                <Zap className="h-3 w-3" />
                {successRate.toFixed(1)}% payment success
              </span>
              <div className="flex items-center gap-1.5 text-xs text-white/65">
                <span className="font-bold uppercase tracking-[0.14em] text-white/45">
                  Platform revenue
                </span>
                <span className="font-bold text-amber-300">
                  {formatGHS(metrics?.platformRevenue30d ?? 0)}
                </span>
              </div>
            </div>
          </div>

          <CircleProgress
            value={successRate}
            label={`${Math.round(successRate)}%`}
            caption="SUCCESS"
            size={160}
          />
        </div>
      </section>

      {/* ===================== 4 STAT TILES ===================== */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          icon={<DollarSign className="h-5 w-5" />}
          tone="gold"
          label="GMV (30d)"
          value={formatGHS(metrics?.gmv30d ?? 0)}
          hint="Across all stores"
          valueAccent="gold"
        />
        <StatTile
          icon={<Trophy className="h-5 w-5" />}
          tone="emerald"
          label="Platform revenue"
          value={formatGHS(metrics?.platformRevenue30d ?? 0)}
          hint="Commission earned"
          valueAccent="emerald"
        />
        <StatTile
          icon={<ShoppingCart className="h-5 w-5" />}
          tone="sky"
          label="Orders today"
          value={formatCompact(metrics?.ordersToday ?? 0)}
          hint="Last 24 hours"
        />
        <StatTile
          icon={<Store className="h-5 w-5" />}
          tone="violet"
          label="Active vendors"
          value={String(metrics?.activeVendors ?? 0)}
          hint="Selling now"
        />
      </section>

      {/* ===================== STATUS BANNER ===================== */}
      {opsTotal === 0 && pendingVendors.length === 0 ? (
        <section className="banner-success">
          <span className="banner-icon">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h4>You&apos;re completely caught up!</h4>
            <p>
              No pending vendors, withdrawals, complaints, or AFA cases in the
              queue.
            </p>
          </div>
        </section>
      ) : (
        <section className="banner-info">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900">
            <Headphones className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h4 className="font-bold text-amber-900">
              {opsTotal + pendingVendors.length} item
              {opsTotal + pendingVendors.length === 1 ? "" : "s"} need attention
            </h4>
            <p className="text-xs text-amber-800">
              {pendingVendors.length} vendor approvals · {agentOps.pendingWithdrawals}{" "}
              withdrawals · {agentOps.openComplaints} complaints ·{" "}
              {agentOps.pendingMtnAfa} AFA cases
            </p>
          </div>
          <Link href="/admin/agent-ops" className="ml-auto susu-btn-gold shrink-0">
            Open queue
          </Link>
        </section>
      )}

      {/* ===================== 3 MINI STATS ===================== */}
      <section className="grid grid-cols-3 gap-3 sm:gap-4">
        <MiniTile
          icon={<Wallet className="h-4 w-4" />}
          tone="amber"
          label="Paystack share"
          value={`${Math.round(paystackShare)}%`}
        />
        <MiniTile
          icon={<Zap className="h-4 w-4" />}
          tone="emerald"
          label="Success rate"
          value={`${Math.round(successRate)}%`}
        />
        <MiniTile
          icon={<Users className="h-4 w-4" />}
          tone="sky"
          label="Top customers"
          value={String(topCustomers.length)}
        />
      </section>

      {/* ===================== WHOLESALE + GOVERNANCE ===================== */}
      <section className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <WholesaleOverviewMini wholesale={wholesale} variant="admin" />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <div className="section-card">
            <div className="section-card-header">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-700" />
                <h3 className="font-extrabold tracking-tight text-slate-900">
                  Vendor governance
                </h3>
              </div>
              <Link
                href="/admin/vendors"
                className="text-[11px] font-bold uppercase tracking-wider text-amber-700 hover:underline"
              >
                View all <ArrowUpRight className="ml-0.5 inline h-3 w-3" />
              </Link>
            </div>
            {topByOrders.length === 0 ? (
              <p className="text-sm text-slate-500">No vendors yet.</p>
            ) : (
              <ul className="-mx-2 divide-y divide-slate-100">
                {topByOrders.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-2 px-2 py-2.5 text-sm"
                  >
                    <span className="truncate font-semibold text-slate-900">
                      {v.business_name}
                    </span>
                    <span
                      className={
                        v.status === "approved"
                          ? "susu-pill susu-pill-active"
                          : "susu-pill susu-pill-warn"
                      }
                    >
                      <span className="dot" />
                      {v.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Ops queue */}
          <div className="section-card">
            <div className="section-card-header">
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-amber-700" />
                <h3 className="font-extrabold tracking-tight text-slate-900">
                  Agent operations
                </h3>
              </div>
              <Link
                href="/admin/agent-ops"
                className="text-[11px] font-bold uppercase tracking-wider text-amber-700 hover:underline"
              >
                Manage <ArrowUpRight className="ml-0.5 inline h-3 w-3" />
              </Link>
            </div>
            <ul className="-mx-2 divide-y divide-slate-100">
              <OpsRow
                label="Pending reward payouts"
                value={agentOps.pendingWithdrawals}
              />
              <OpsRow label="Open complaints" value={agentOps.openComplaints} />
              <OpsRow label="MTN AFA pending" value={agentOps.pendingMtnAfa} />
              <OpsRow
                label="Active ClaimIt codes"
                value={agentOps.activePromoCodes}
                tone="muted"
              />
            </ul>
          </div>
        </div>
      </section>

      {/* ===================== TOP CUSTOMERS ===================== */}
      <section className="section-card overflow-hidden">
        <div className="section-card-header">
          <div>
            <h3 className="font-extrabold tracking-tight text-slate-900">
              Top customers
            </h3>
            <p className="text-sm text-slate-500">
              By total spend across all stores.
            </p>
          </div>
        </div>
        {topCustomers.length === 0 ? (
          <p className="text-sm text-slate-500">No customer orders recorded yet.</p>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50">
                  <th className="px-5 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Customer
                  </th>
                  <th className="px-5 py-2.5 text-right text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Orders
                  </th>
                  <th className="px-5 py-2.5 text-right text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Spend
                  </th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c) => (
                  <tr
                    key={c.userId}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {c.name}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {c.orders}
                    </td>
                    <td className="px-5 py-3 text-right font-bold tabular-nums text-amber-700">
                      {formatGHS(c.spend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===================== TRUST STRIP ===================== */}
      <section className="grid gap-3 sm:grid-cols-3">
        <TrustCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Settlement security"
          body="Paystack-secured payments with audited reconciliation twice daily."
          tone="emerald"
        />
        <TrustCard
          icon={<Zap className="h-5 w-5" />}
          title="Sub-2-minute fulfilment"
          body="Skanka5 + manual ops keep MTN, Telecel, AT routes hot 24/7."
          tone="sky"
        />
        <TrustCard
          icon={<Trophy className="h-5 w-5" />}
          title="Vendor incentives"
          body="Tier rewards and ClaimIt codes drive volume to top performers."
          tone="amber"
        />
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
    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
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
    <li className="flex items-center justify-between px-2 py-2.5 text-sm">
      <span className="text-slate-600">{label}</span>
      <span
        className={
          tone === "muted"
            ? "text-base font-extrabold text-slate-400"
            : value > 0
              ? "text-base font-extrabold text-amber-700"
              : "text-base font-extrabold text-emerald-700"
        }
      >
        {value}
      </span>
    </li>
  );
}

function TrustCard({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: "emerald" | "amber" | "sky" | "violet";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_8px_24px_rgba(10,46,93,0.08)]">
      <div className={`stat-tile-icon tile-icon-${tone}`}>{icon}</div>
      <h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}
