import { BarChart3, ShoppingCart, Store, TrendingUp, Zap } from "lucide-react";
import {
  AdminBreakdownRow,
  AdminConfigError,
  AdminEmptyState,
  AdminPageIntro,
  AdminPageRoot,
  AdminSection,
  AdminStatGrid,
  AdminStatTile,
} from "@/components/admin";
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
    return <AdminConfigError />;
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

  const failedPct =
    orderStats.total > 0
      ? Math.round((orderStats.failed / orderStats.total) * 1000) / 10
      : 0;

  const inProgress =
    orderStats.total - orderStats.fulfilled - orderStats.failed;

  const topVendors = vendors
    .filter((v) => v.status === "approved")
    .sort((a, b) => b.total_orders - a.total_orders)
    .slice(0, 5);

  const maxOrders = topVendors[0]?.total_orders ?? 1;

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="Platform analytics"
        description="Performance metrics from live order and vendor data."
        meta={`${orderStats.total} orders tracked · ${metrics?.activeVendors ?? 0} active vendors`}
      />

      <AdminStatGrid>
        <AdminStatTile
          icon={<TrendingUp className="h-4 w-4" />}
          tone="gold"
          label="GMV (tracked)"
          value={formatGHS(orderStats.revenue)}
          valueAccent="gold"
        />
        <AdminStatTile
          icon={<ShoppingCart className="h-4 w-4" />}
          tone="sky"
          label="Total orders"
          value={formatCompact(orderStats.total)}
        />
        <AdminStatTile
          icon={<Zap className="h-4 w-4" />}
          tone="emerald"
          label="Fulfilment rate"
          value={`${fulfilmentRate}%`}
          valueAccent="emerald"
        />
        <AdminStatTile
          icon={<Store className="h-4 w-4" />}
          tone="violet"
          label="Active vendors"
          value={String(metrics?.activeVendors ?? 0)}
        />
      </AdminStatGrid>

      <div className="grid gap-3 lg:grid-cols-2">
        <AdminSection title="Order breakdown" description="Status distribution across all orders." icon={BarChart3}>
          {orderStats.total === 0 ? (
            <AdminEmptyState
              icon={ShoppingCart}
              title="No orders yet"
              description="Order breakdown will populate once checkout activity begins."
            />
          ) : (
            <ul className="space-y-3">
              <AdminBreakdownRow
                label="Fulfilled"
                value={formatCompact(orderStats.fulfilled)}
                pct={fulfilmentRate}
                barPct={fulfilmentRate}
              />
              <AdminBreakdownRow
                label="Failed"
                value={formatCompact(orderStats.failed)}
                pct={failedPct}
                barPct={failedPct}
              />
              <AdminBreakdownRow
                label="In progress"
                value={formatCompact(inProgress)}
                barPct={
                  orderStats.total > 0
                    ? Math.round((inProgress / orderStats.total) * 1000) / 10
                    : 0
                }
              />
            </ul>
          )}
        </AdminSection>

        <AdminSection title="Top vendors" description="Approved stores ranked by order volume." icon={Store}>
          {topVendors.length === 0 ? (
            <AdminEmptyState
              icon={Store}
              title="No approved vendors"
              description="Vendor rankings appear once stores are approved and selling."
            />
          ) : (
            <ul className="space-y-3">
              {topVendors.map((v, i) => {
                const barPct =
                  maxOrders > 0 ? Math.round((v.total_orders / maxOrders) * 100) : 0;
                return (
                  <AdminBreakdownRow
                    key={v.id}
                    label={`${i + 1}. ${v.business_name}`}
                    value={formatCompact(v.total_orders)}
                    barPct={barPct}
                  />
                );
              })}
            </ul>
          )}
        </AdminSection>
      </div>

      <AdminSection title="Today's pulse" description="Rolling 24-hour activity snapshot." icon={Zap}>
        <AdminStatGrid className="lg:grid-cols-3">
          <AdminStatTile
            icon={<ShoppingCart className="h-3.5 w-3.5" />}
            tone="sky"
            label="Orders today"
            value={formatCompact(metrics?.ordersToday ?? 0)}
          />
          <AdminStatTile
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            tone="emerald"
            label="Fulfilled today"
            value={formatCompact(metrics?.ordersFulfilledToday ?? 0)}
            valueAccent="emerald"
          />
          <AdminStatTile
            icon={<Zap className="h-3.5 w-3.5" />}
            tone="gold"
            label="Success rate"
            value={`${metrics?.successRate ?? 0}%`}
            valueAccent="gold"
          />
        </AdminStatGrid>
      </AdminSection>
    </AdminPageRoot>
  );
}
