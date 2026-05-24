import "server-only";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { getAgentTierSettings } from "@/lib/data/tier-settings";
import {
  resolveTierFromPerformance,
  type TierPromotionResult,
  type VendorPerformanceSnapshot,
} from "@/lib/vendor/tier-rules";
import { tierUpdatesFor } from "@/lib/vendor/tiers";
import type { VendorTier } from "@/types";

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function fetchVendorPerformanceSnapshots(): Promise<VendorPerformanceSnapshot[]> {
  if (!hasSupabaseConfig()) return [];

  const service = createServiceClient();
  const since = startOfTodayIso();

  const [vendorsRes, metricsRes, todayRes] = await Promise.all([
    service.from("vendors").select("id, tier, tier_manual"),
    service.from("vendor_metrics").select("vendor_id, fulfilled_orders, total_orders, success_rate"),
    service
      .from("orders")
      .select("vendor_id")
      .gte("created_at", since)
      .in("status", ["paid", "queued", "processing", "fulfilled"]),
  ]);

  const vendors = (vendorsRes.data ?? []) as Array<{
    id: string;
    tier: VendorTier;
    tier_manual: boolean;
  }>;

  const metricsByVendor = new Map(
    ((metricsRes.data ?? []) as Array<{
      vendor_id: string;
      fulfilled_orders: number;
      total_orders: number;
      success_rate: number;
    }>).map((m) => [m.vendor_id, m]),
  );

  const todayCounts = new Map<string, number>();
  for (const row of (todayRes.data ?? []) as Array<{ vendor_id: string }>) {
    todayCounts.set(row.vendor_id, (todayCounts.get(row.vendor_id) ?? 0) + 1);
  }

  return vendors.map((v) => {
    const m = metricsByVendor.get(v.id);
    return {
      vendorId: v.id,
      currentTier: v.tier ?? "starter",
      tierManual: v.tier_manual ?? false,
      fulfilledOrders: Number(m?.fulfilled_orders ?? 0),
      totalOrders: Number(m?.total_orders ?? 0),
      successRate: Number(m?.success_rate ?? 0),
      ordersToday: todayCounts.get(v.id) ?? 0,
    };
  });
}

export async function recalculateVendorTiers(): Promise<TierPromotionResult[]> {
  if (!hasSupabaseConfig()) return [];

  const snapshots = await fetchVendorPerformanceSnapshots();
  const settings = await getAgentTierSettings();
  const promotions: TierPromotionResult[] = [];
  const service = createServiceClient();

  for (const snapshot of snapshots) {
    const result = resolveTierFromPerformance(snapshot, settings);
    if (!result) continue;

    const { error } = await service
      .from("vendors")
      .update(tierUpdatesFor(result.toTier, false, settings))
      .eq("id", result.vendorId);

    if (!error) promotions.push(result);
  }

  return promotions;
}

export async function getVendorTierForReward(vendorId: string): Promise<VendorTier> {
  if (!hasSupabaseConfig()) return "starter";

  const service = createServiceClient();
  const { data } = await service.from("vendors").select("tier").eq("id", vendorId).maybeSingle();
  const row = data as { tier: VendorTier | null } | null;
  return row?.tier ?? "starter";
}
