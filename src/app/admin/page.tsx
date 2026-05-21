import Link from "next/link";
import { DollarSign, ShoppingCart, Store, Headphones } from "lucide-react";
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
      <div className="card-elevated p-8 text-center text-muted">
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

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="GMV (30d)"
          value={formatGHS(metrics?.gmv30d ?? 0)}
          icon={DollarSign}
        />
        <StatCard
          label="Platform revenue"
          value={formatGHS(metrics?.platformRevenue30d ?? 0)}
          icon={DollarSign}
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

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <WholesaleOverviewMini wholesale={wholesale} variant="admin" />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="card-elevated p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Vendor governance</h2>
              <Link href="/admin/vendors" className="text-xs font-semibold text-gold-dark hover:underline">
                View all
              </Link>
            </div>
            {topByOrders.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No vendors yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {topByOrders.map((v) => (
                  <li key={v.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{v.business_name}</span>
                    <Badge variant={v.status === "approved" ? "success" : "warning"}>
                      {v.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            {pendingVendors.length > 0 && (
              <p className="mt-4 text-xs text-warning">
                {pendingVendors.length} vendor(s) awaiting approval
              </p>
            )}
          </div>

          <div className="card-elevated p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Agent operations</h2>
              <Link
                href="/admin/agent-ops"
                className="text-xs font-semibold text-gold-dark hover:underline"
              >
                Manage
              </Link>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-muted">Pending reward payouts</span>
                <span className="font-semibold">{agentOps.pendingWithdrawals}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">Open complaints</span>
                <span className="font-semibold">{agentOps.openComplaints}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">MTN AFA pending</span>
                <span className="font-semibold">{agentOps.pendingMtnAfa}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">Active ClaimIt codes</span>
                <span className="font-semibold">{agentOps.activePromoCodes}</span>
              </li>
            </ul>
            {(agentOps.pendingWithdrawals > 0 ||
              agentOps.openComplaints > 0 ||
              agentOps.pendingMtnAfa > 0) && (
              <Link
                href="/admin/agent-ops"
                className="mt-4 flex items-center gap-2 text-xs font-semibold text-warning hover:underline"
              >
                <Headphones className="h-3.5 w-3.5" />
                Action required in agent operations
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-elevated p-5">
          <h2 className="font-semibold">Payment performance</h2>
          <div className="mt-6 space-y-4">
            <MetricBar label="Success rate" value={metrics?.successRate ?? 0} />
            <MetricBar label="Paystack" value={metrics?.paystackShare ?? 100} />
          </div>
        </div>

        <div className="card-elevated p-5">
          <h2 className="font-semibold">Top customers</h2>
          {topCustomers.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No customer orders recorded yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Orders</th>
                    <th className="pb-3 font-medium">Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((c) => (
                    <tr key={c.userId} className="border-b border-border/50">
                      <td className="py-3 font-medium">{c.name}</td>
                      <td className="py-3">{c.orders}</td>
                      <td className="py-3">{formatGHS(c.spend)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full gradient-accent transition-all"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
