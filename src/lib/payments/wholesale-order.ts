import "server-only";
import { after } from "next/server";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { dispatchWholesaleOrderToSupplier } from "@/lib/suppliers/dispatch";
import { normalizeWholesalePrices } from "@/lib/wholesale/tier-pricing";
import type { WholesaleBundle } from "@/types";

export function generateWholesaleOrderReference(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `DCS-WHOLESALE-${date}-${rand}`;
}

export interface CreateWholesaleOrderItem {
  wholesaleBundleId: string;
  recipientPhone: string;
  unitPrice: number;
  quantity: number;
}

export async function createWholesaleOrder(params: {
  vendorId: string;
  source: "single" | "bulk" | "manual";
  items: CreateWholesaleOrderItem[];
}) {
  if (!hasSupabaseConfig()) throw new Error("Database not configured");

  const service = createServiceClient();
  const reference = generateWholesaleOrderReference();
  const totalAmount = +params.items
    .reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    .toFixed(2);
  const itemCount = params.items.reduce((s, i) => s + i.quantity, 0);

  const { data: order, error: orderErr } = await service
    .from("wholesale_orders")
    .insert({
      reference,
      vendor_id: params.vendorId,
      status: "pending",
      total_amount: totalAmount,
      item_count: itemCount,
      payment_provider: "paystack",
      source: params.source,
    })
    .select("id, reference, total_amount")
    .single();

  if (orderErr || !order) {
    console.error("[wholesale_order_insert]", orderErr);
    throw new Error("Could not create order");
  }

  const o = order as { id: string; reference: string; total_amount: number };

  const itemRows = params.items.map((item) => ({
    wholesale_order_id: o.id,
    wholesale_bundle_id: item.wholesaleBundleId,
    recipient_phone: item.recipientPhone,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    line_total: +(item.unitPrice * item.quantity).toFixed(2),
    status: "pending",
  }));

  const { error: itemsErr } = await service.from("wholesale_order_items").insert(itemRows);
  if (itemsErr) {
    console.error("[wholesale_order_items_insert]", itemsErr);
    throw new Error("Could not create order items");
  }

  return o;
}

export async function markWholesaleOrderPaid(reference: string, paymentReference: string) {
  if (!hasSupabaseConfig()) return;
  const service = createServiceClient();

  const { data: order } = await service
    .from("wholesale_orders")
    .select("id, status")
    .eq("reference", reference)
    .maybeSingle();

  const o = order as { id: string; status: string } | null;
  if (!o || o.status !== "pending") return;

  const now = new Date().toISOString();
  await service
    .from("wholesale_orders")
    .update({
      status: "queued",
      paid_at: now,
      payment_reference: paymentReference,
    })
    .eq("id", o.id);

  await service
    .from("wholesale_order_items")
    .update({ status: "queued" })
    .eq("wholesale_order_id", o.id);

  // Hand the order to the supplier (Skanka5) AFTER the response is sent. Using
  // `after()` (not bare `void`) keeps the serverless function alive until the
  // supplier call finishes, so auto-dispatch actually runs in production.
  // Failures are surfaced via wholesale_orders.supplier_error and admin can
  // retry from /admin/orders.
  after(() => dispatchWholesaleOrderToSupplier(o.id));
}

interface WholesaleOrderRow {
  id: string;
  reference: string;
  vendor_id: string;
  status: string;
  total_amount: number;
  item_count: number;
  source: string;
  created_at: string;
  paid_at: string | null;
}

interface WholesaleOrderItemRow {
  id: string;
  wholesale_order_id: string;
  wholesale_bundle_id: string;
  recipient_phone: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  status: string;
  wholesale_bundles: {
    sku: string;
    name: string;
    network: string;
    data_mb: number;
    validity_days: number;
  } | {
    sku: string;
    name: string;
    network: string;
    data_mb: number;
    validity_days: number;
  }[];
}

export interface WholesaleOrderSummary {
  id: string;
  reference: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  source: string;
  createdAt: string;
  paidAt: string | null;
  items: {
    id: string;
    phone: string;
    quantity: number;
    lineTotal: number;
    status: string;
    bundleName: string;
    network: string;
    dataMb: number;
  }[];
}

export async function fetchVendorWholesaleOrders(
  vendorId: string,
  limit = 50,
): Promise<WholesaleOrderSummary[]> {
  if (!hasSupabaseConfig()) return [];
  const service = createServiceClient();

  const { data, error } = await service
    .from("wholesale_orders")
    .select(
      `
      id, reference, status, total_amount, item_count, source, created_at, paid_at,
      wholesale_order_items (
        id, recipient_phone, unit_price, quantity, line_total, status,
        wholesale_bundles ( sku, name, network, data_mb, validity_days )
      )
      `,
    )
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("[fetchVendorWholesaleOrders]", error);
    return [];
  }

  return (data as unknown as Array<
    WholesaleOrderRow & { wholesale_order_items: WholesaleOrderItemRow[] }
  >).map((row) => ({
      id: row.id,
      reference: row.reference,
      status: row.status,
      totalAmount: Number(row.total_amount),
      itemCount: row.item_count,
      source: row.source,
      createdAt: row.created_at,
      paidAt: row.paid_at,
      items: (row.wholesale_order_items ?? []).map((it) => {
        const wb = Array.isArray(it.wholesale_bundles)
          ? it.wholesale_bundles[0]
          : it.wholesale_bundles;
        return {
          id: it.id,
          phone: it.recipient_phone,
          quantity: it.quantity,
          lineTotal: Number(it.line_total),
          status: it.status,
          bundleName: wb?.name ?? "Bundle",
          network: wb?.network ?? "",
          dataMb: wb?.data_mb ?? 0,
        };
      }),
    }));
}

export async function fetchWholesaleBundleById(id: string): Promise<WholesaleBundle | null> {
  if (!hasSupabaseConfig()) return null;
  const service = createServiceClient();
  const { data } = await service
    .from("wholesale_bundles")
    .select(
      "id, sku, network, name, data_mb, validity_days, cost_price, customer_price, customer_pro_price, agent_price, agent_pro_price, xpress_agent_price, wholesale_price, suggested_retail, min_markup, max_markup, popular, active, product_line",
    )
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();

  const row = data as {
    id: string;
    sku: string;
    network: WholesaleBundle["network"];
    name: string;
    data_mb: number;
    validity_days: number;
    cost_price: number | null;
    customer_price: number | null;
    customer_pro_price: number | null;
    agent_price: number | null;
    agent_pro_price: number | null;
    xpress_agent_price: number | null;
    wholesale_price: number;
    suggested_retail: number;
    min_markup: number;
    max_markup: number | null;
    popular: boolean;
    product_line?: string | null;
  } | null;

  if (!row) return null;
  const prices = normalizeWholesalePrices({
    costPrice: row.cost_price ?? undefined,
    customerPrice: row.customer_price ?? undefined,
    customerProPrice: row.customer_pro_price ?? undefined,
    agentPrice: row.agent_price ?? undefined,
    agentProPrice: row.agent_pro_price ?? undefined,
    xpressAgentPrice: row.xpress_agent_price ?? undefined,
    wholesalePrice: row.wholesale_price,
    suggestedRetail: row.suggested_retail,
  });
  const line = row.product_line as WholesaleBundle["productLine"];
  return {
    id: row.id,
    sku: row.sku,
    network: row.network,
    name: row.name,
    dataMb: row.data_mb,
    validityDays: row.validity_days,
    ...prices,
    wholesalePrice: prices.agentPrice,
    suggestedRetail: prices.customerPrice,
    minMarkup: Number(row.min_markup),
    maxMarkup: row.max_markup ? Number(row.max_markup) : null,
    popular: row.popular,
    productLine: line ?? null,
  };
}
