import {
  fetchAdminOrderStats,
  fetchAdminOverview,
  fetchAdminVendors,
} from "@/lib/data/admin-queries";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { formatGHS, formatCompact } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="card-elevated p-8 text-center text-muted">Database not configured.</div>
    );
  }

  const [orderStats, metrics, vendors] = await Promise.all([
    fetchAdminOrderStats(),
    fetchAdminOverview(),
    fetchAdminVendors(),
  ]);

  const fulfilmentRate =
    orderStats.total > 0
      ? Math.round((orderStats.fulfilled / orderStats.total) * 1000) / 10
      : 0;

  const topVendors = vendors
    .filter((v) => v.status === "approved")
    .sort((a, b) => b.total_orders - a.total_orders)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Analytics</h2>
        <p className="mt-1 text-sm text-muted">Platform performance from live data</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="GMV (tracked)" value={formatGHS(orderStats.revenue)} />
        <Card label="Total orders" value={formatCompact(orderStats.total)} />
        <Card label="Fulfilment rate" value={`${fulfilmentRate}%`} />
        <Card label="Active vendors" value={String(metrics?.activeVendors ?? 0)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-elevated p-5">
          <h3 className="font-semibold">Order breakdown</h3>
          {orderStats.total === 0 ? (
            <p className="mt-4 text-sm text-muted">No orders in the database yet.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              <Row label="Fulfilled" value={formatCompact(orderStats.fulfilled)} pct={fulfilmentRate} />
              <Row
                label="Failed"
                value={formatCompact(orderStats.failed)}
                pct={
                  orderStats.total > 0
                    ? Math.round((orderStats.failed / orderStats.total) * 1000) / 10
                    : 0
                }
              />
              <Row
                label="In progress"
                value={formatCompact(
                  orderStats.total - orderStats.fulfilled - orderStats.failed,
                )}
              />
            </ul>
          )}
        </div>

        <div className="card-elevated p-5">
          <h3 className="font-semibold">Top vendors by orders</h3>
          {topVendors.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No approved vendors yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topVendors.map((v, i) => (
                <li key={v.id} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="mr-2 font-bold text-muted">{i + 1}.</span>
                    {v.business_name}
                  </span>
                  <span className="num font-semibold">{formatCompact(v.total_orders)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card-elevated p-5">
        <h3 className="font-semibold">Today&apos;s pulse</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Card label="Orders today" value={formatCompact(metrics?.ordersToday ?? 0)} compact />
          <Card
            label="Fulfilled today"
            value={formatCompact(metrics?.ordersFulfilledToday ?? 0)}
            compact
          />
          <Card
            label="Success rate"
            value={`${metrics?.successRate ?? 0}%`}
            compact
          />
        </div>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "card-elevated px-4 py-3"}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className={`num mt-1 font-extrabold text-foreground ${compact ? "text-lg" : "text-2xl"}`}>
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  pct,
}: {
  label: string;
  value: string;
  pct?: number;
}) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-semibold">
        {value}
        {pct != null && <span className="ml-2 text-xs text-muted">({pct}%)</span>}
      </span>
    </li>
  );
}
