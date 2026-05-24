import "server-only";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import type { VendorStatus, VendorTier } from "@/types";

export interface AdminVendorRow {
  id: string;
  slug: string;
  business_name: string;
  status: VendorStatus;
  kyc_status: string | null;
  verified: boolean;
  featured: boolean;
  tier: VendorTier;
  tier_manual: boolean;
  commission_rate: number;
  rating: number;
  total_orders: number;
  fulfilment_minutes: number;
  created_at: string;
}

export interface AdminOverviewMetrics {
  gmv30d: number;
  platformRevenue30d: number;
  ordersToday: number;
  ordersFulfilledToday: number;
  activeVendors: number;
  /** Share of orders that received payment (paid / queued / processing / fulfilled). */
  successRate: number;
  /** Share of paid orders that reached fulfilled status. */
  fulfillmentRate: number;
  paystackShare: number;
}

export interface AdminCustomerPaymentRow {
  id: string;
  reference: string;
  recipient_phone: string;
  amount: number;
  platform_fee: number;
  status: string;
  payment_provider: string | null;
  created_at: string;
  vendor_name: string;
  vendor_slug: string;
  bundle_name: string | null;
}

const PAYMENT_SUCCESS_STATUSES = ["paid", "queued", "processing", "fulfilled"] as const;

export interface AdminTopCustomer {
  userId: string;
  name: string;
  orders: number;
  spend: number;
}

const THIRTY_DAYS_AGO = () =>
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

export async function fetchAdminVendors(): Promise<AdminVendorRow[]> {
  if (!hasSupabaseConfig()) return [];
  const service = createServiceClient();
  const { data, error } = await service
    .from("vendors")
    .select(
      "id, slug, business_name, status, kyc_status, verified, featured, tier, tier_manual, commission_rate, rating, total_orders, fulfilment_minutes, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchAdminVendors]", error);
    return [];
  }
  return ((data ?? []) as AdminVendorRow[]).map((row) => ({
    ...row,
    tier: row.tier ?? "starter",
    tier_manual: row.tier_manual ?? false,
    commission_rate: Number(row.commission_rate ?? 8),
  }));
}

export async function fetchAdminOverview(): Promise<AdminOverviewMetrics | null> {
  if (!hasSupabaseConfig()) return null;

  const service = createServiceClient();
  const since = THIRTY_DAYS_AGO();

  const [orders30d, ordersToday, vendorsRes, platformStats] = await Promise.all([
    service
      .from("orders")
      .select("amount, platform_fee, status, payment_provider")
      .gte("created_at", since),
    service
      .from("orders")
      .select("status, amount")
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    service.from("vendors").select("id, status").eq("status", "approved"),
    service.from("platform_stats").select("*").maybeSingle(),
  ]);

  const rows30d = (orders30d.data ?? []) as {
    amount: number;
    platform_fee: number;
    status: string;
    payment_provider: string | null;
  }[];

  const gmv30d = rows30d.reduce((s, r) => s + Number(r.amount), 0);
  const platformRevenue30d = rows30d.reduce((s, r) => s + Number(r.platform_fee ?? 0), 0);

  const paymentSuccess = rows30d.filter((r) =>
    PAYMENT_SUCCESS_STATUSES.includes(r.status as (typeof PAYMENT_SUCCESS_STATUSES)[number]),
  ).length;
  const fulfilledCount = rows30d.filter((r) => r.status === "fulfilled").length;

  const paymentSuccessRate =
    rows30d.length > 0 ? Math.round((paymentSuccess / rows30d.length) * 1000) / 10 : 100;
  const fulfillmentRate =
    paymentSuccess > 0 ? Math.round((fulfilledCount / paymentSuccess) * 1000) / 10 : 100;

  const paystackCount = rows30d.filter((r) => r.payment_provider === "paystack").length;
  const paidCount = rows30d.filter((r) =>
    ["paid", "queued", "processing", "fulfilled"].includes(r.status),
  ).length;
  const paystackShare = paidCount > 0 ? Math.round((paystackCount / paidCount) * 100) : 100;

  const todayRows = (ordersToday.data ?? []) as { status: string }[];
  const ps = platformStats.data as {
    orders_today?: number;
    orders_fulfilled_today?: number;
    active_vendors?: number;
    success_rate?: number;
  } | null;

  return {
    gmv30d,
    platformRevenue30d,
    ordersToday: ps?.orders_today ?? todayRows.length,
    ordersFulfilledToday:
      ps?.orders_fulfilled_today ??
      todayRows.filter((r) => r.status === "fulfilled").length,
    activeVendors: vendorsRes.data?.length ?? ps?.active_vendors ?? 0,
    successRate: rows30d.length > 0 ? paymentSuccessRate : Number(ps?.success_rate ?? 100),
    fulfillmentRate,
    paystackShare,
  };
}

export async function fetchAdminCustomerPayments(
  limit = 100,
): Promise<AdminCustomerPaymentRow[]> {
  if (!hasSupabaseConfig()) return [];

  const service = createServiceClient();
  const { data, error } = await service
    .from("orders")
    .select(
      `
      id, reference, recipient_phone, amount, platform_fee, status, payment_provider, created_at,
      vendors!inner ( business_name, slug ),
      bundles ( name )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("[fetchAdminCustomerPayments]", error);
    return [];
  }

  return data.map((row) => {
    const r = row as {
      id: string;
      reference: string;
      recipient_phone: string;
      amount: number;
      platform_fee: number;
      status: string;
      payment_provider: string | null;
      created_at: string;
      vendors: { business_name: string; slug: string } | { business_name: string; slug: string }[];
      bundles: { name: string } | { name: string }[] | null;
    };
    const vendor = Array.isArray(r.vendors) ? r.vendors[0] : r.vendors;
    const bundle = Array.isArray(r.bundles) ? r.bundles[0] : r.bundles;
    return {
      id: r.id,
      reference: r.reference,
      recipient_phone: r.recipient_phone,
      amount: Number(r.amount),
      platform_fee: Number(r.platform_fee ?? 0),
      status: r.status,
      payment_provider: r.payment_provider,
      created_at: r.created_at,
      vendor_name: vendor?.business_name ?? "—",
      vendor_slug: vendor?.slug ?? "",
      bundle_name: bundle?.name ?? null,
    };
  });
}

export async function fetchAdminTopCustomers(limit = 5): Promise<AdminTopCustomer[]> {
  if (!hasSupabaseConfig()) return [];

  const service = createServiceClient();
  const { data: orders, error } = await service
    .from("orders")
    .select("user_id, amount")
    .not("user_id", "is", null)
    .in("status", ["fulfilled", "paid", "processing", "queued"]);

  if (error || !orders?.length) return [];

  const byUser = new Map<string, { orders: number; spend: number }>();
  for (const row of orders as { user_id: string; amount: number }[]) {
    const cur = byUser.get(row.user_id) ?? { orders: 0, spend: 0 };
    cur.orders += 1;
    cur.spend += Number(row.amount);
    byUser.set(row.user_id, cur);
  }

  const sorted = [...byUser.entries()]
    .sort((a, b) => b[1].spend - a[1].spend)
    .slice(0, limit);

  const userIds = sorted.map(([id]) => id);
  const { data: profiles } = await service
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const nameMap = new Map(
    (profiles ?? []).map((p) => {
      const row = p as { id: string; full_name: string | null; email: string };
      return [row.id, row.full_name || row.email.split("@")[0]] as const;
    }),
  );

  return sorted.map(([userId, agg]) => ({
    userId,
    name: nameMap.get(userId) ?? "Customer",
    orders: agg.orders,
    spend: agg.spend,
  }));
}

export async function fetchAdminOrderStats() {
  if (!hasSupabaseConfig()) {
    return { total: 0, fulfilled: 0, failed: 0, revenue: 0 };
  }
  const service = createServiceClient();
  const { data } = await service.from("orders").select("status, amount");
  const rows = (data ?? []) as { status: string; amount: number }[];
  return {
    total: rows.length,
    fulfilled: rows.filter((r) => r.status === "fulfilled").length,
    failed: rows.filter((r) => r.status === "failed").length,
    revenue: rows
      .filter((r) => ["fulfilled", "paid", "processing", "queued"].includes(r.status))
      .reduce((s, r) => s + Number(r.amount), 0),
  };
}
