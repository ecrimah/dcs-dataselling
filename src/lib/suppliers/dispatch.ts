import "server-only";

import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import {
  isSkanka5Configured,
  submitBulkOrder,
  submitSingleOrder,
  type Skanka5NetworkSlug,
  type Skanka5OrderRow,
} from "@/lib/suppliers/skanka5";

/**
 * Dispatch a paid customer storefront order to Skanka5.
 * Called from the Paystack webhook after the order is marked `queued`.
 *
 * Behaviour:
 *  - Supplier accepted    -> status `processing`, record supplier_reference / order_code
 *  - Supplier rejected    -> status `failed`, record error (admin can retry / refund)
 *  - Supplier unreachable -> leave status `queued`, record error (retry-able)
 */
export async function dispatchCustomerOrderToSupplier(orderId: string): Promise<void> {
  if (!hasSupabaseConfig() || !isSkanka5Configured()) return;

  const service = createServiceClient();
  const { data, error } = await service
    .from("orders")
    .select(
      `
      id, reference, status, recipient_phone, supplier_reference,
      bundles ( network, data_mb )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) {
    console.error("[dispatch customer]", error);
    return;
  }

  const row = data as {
    id: string;
    reference: string;
    status: string;
    recipient_phone: string;
    supplier_reference: string | null;
    bundles:
      | { network: Skanka5NetworkSlug; data_mb: number }
      | { network: Skanka5NetworkSlug; data_mb: number }[]
      | null;
  };

  if (row.supplier_reference) return; // already submitted
  if (!["paid", "queued"].includes(row.status)) return;

  const bundle = Array.isArray(row.bundles) ? row.bundles[0] : row.bundles;
  if (!bundle) {
    await service
      .from("orders")
      .update({
        supplier: "skanka5",
        supplier_status: "failed",
        supplier_error: "Bundle missing",
      })
      .eq("id", row.id);
    return;
  }

  const result = await submitSingleOrder({
    network: bundle.network,
    msisdn: row.recipient_phone,
    volumeMb: bundle.data_mb,
    reference: row.reference,
    scope: "customer_order",
  });

  if (!result.ok) {
    await service
      .from("orders")
      .update({
        supplier: "skanka5",
        supplier_status: "failed",
        supplier_error: result.error.slice(0, 500),
        supplier_submitted_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    return;
  }

  const first = result.data.orders?.[0];
  await service
    .from("orders")
    .update({
      status: "processing",
      supplier: "skanka5",
      supplier_reference: result.data.reference,
      supplier_order_code: first?.order_code ?? null,
      supplier_status: first?.status ?? result.data.status,
      supplier_response: result.data as unknown as object,
      supplier_submitted_at: new Date().toISOString(),
      supplier_error: null,
    })
    .eq("id", row.id);
}

/**
 * Dispatch a paid vendor wholesale order to Skanka5 as a bulk submission.
 * Called from `markWholesaleOrderPaid` (both wallet-debit and Paystack paths).
 */
export async function dispatchWholesaleOrderToSupplier(orderId: string): Promise<void> {
  if (!hasSupabaseConfig() || !isSkanka5Configured()) return;

  const service = createServiceClient();

  const { data: order, error } = await service
    .from("wholesale_orders")
    .select(
      `
      id, reference, status, supplier_reference,
      wholesale_order_items (
        id, recipient_phone, quantity,
        wholesale_bundles ( network, data_mb )
      )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    console.error("[dispatch wholesale]", error);
    return;
  }

  type ItemRow = {
    id: string;
    recipient_phone: string;
    quantity: number;
    wholesale_bundles:
      | { network: Skanka5NetworkSlug; data_mb: number }
      | { network: Skanka5NetworkSlug; data_mb: number }[]
      | null;
  };
  const row = order as {
    id: string;
    reference: string;
    status: string;
    supplier_reference: string | null;
    wholesale_order_items: ItemRow[];
  };

  if (row.supplier_reference) return;
  if (!["queued", "paid", "processing"].includes(row.status)) return;

  const items = (row.wholesale_order_items ?? []).map((it) => {
    const wb = Array.isArray(it.wholesale_bundles) ? it.wholesale_bundles[0] : it.wholesale_bundles;
    return { itemId: it.id, phone: it.recipient_phone, quantity: it.quantity, wb };
  });

  // Group items by network so we can call submitBulkOrder per network.
  const byNetwork = new Map<Skanka5NetworkSlug, typeof items>();
  for (const it of items) {
    if (!it.wb) continue;
    const list = byNetwork.get(it.wb.network) ?? [];
    list.push(it);
    byNetwork.set(it.wb.network, list);
  }

  if (byNetwork.size === 0) {
    await service
      .from("wholesale_orders")
      .update({
        supplier: "skanka5",
        supplier_status: "failed",
        supplier_error: "No items with mapped network",
      })
      .eq("id", row.id);
    return;
  }

  const submissions: { network: string; ok: boolean; reference?: string; error?: string }[] = [];
  let anyAccepted = false;
  let anyFailed = false;

  for (const [network, groupItems] of byNetwork.entries()) {
    // Expand quantities (each unit is a separate MSISDN delivery)
    const recipients: Array<{ msisdn: string; volumeMb: number }> = [];
    for (const it of groupItems) {
      if (!it.wb) continue;
      for (let q = 0; q < it.quantity; q++) {
        recipients.push({ msisdn: it.phone, volumeMb: it.wb.data_mb });
      }
    }

    const result = await submitBulkOrder({
      network,
      recipients,
      reference: `${row.reference}-${network}`,
      scope: "wholesale_order",
    });

    if (!result.ok) {
      anyFailed = true;
      submissions.push({ network, ok: false, error: result.error });
      for (const it of groupItems) {
        await service
          .from("wholesale_order_items")
          .update({
            supplier_status: "failed",
            supplier_error: result.error.slice(0, 500),
          })
          .eq("id", it.itemId);
      }
      continue;
    }

    anyAccepted = true;
    submissions.push({ network, ok: true, reference: result.data.reference });

    // Map supplier `orders` rows back to our items. Since recipients were expanded
    // by quantity, we assign sequentially.
    let idx = 0;
    for (const it of groupItems) {
      const slice = result.data.orders.slice(idx, idx + it.quantity);
      idx += it.quantity;
      await service
        .from("wholesale_order_items")
        .update({
          supplier_order_code: slice[0]?.order_code ?? null,
          supplier_status: slice[0]?.status ?? "accepted",
          supplier_response: slice as unknown as object,
          supplier_error: null,
        })
        .eq("id", it.itemId);
    }
  }

  await service
    .from("wholesale_orders")
    .update({
      status: anyAccepted ? "processing" : "failed",
      supplier: "skanka5",
      supplier_reference: submissions
        .filter((s) => s.reference)
        .map((s) => `${s.network}:${s.reference}`)
        .join(",") || null,
      supplier_status: anyAccepted && !anyFailed ? "accepted" : anyFailed ? "partial" : "failed",
      supplier_response: submissions as unknown as object,
      supplier_submitted_at: new Date().toISOString(),
      supplier_error: anyFailed
        ? submissions.filter((s) => !s.ok).map((s) => `${s.network}: ${s.error}`).join("; ").slice(0, 500)
        : null,
    })
    .eq("id", row.id);
}

/** Resolve fulfilment of items returned by a Skanka5 webhook batch. */
export interface SupplierItemUpdate {
  supplier_reference: string;
  order_code?: string;
  msisdn?: string;
  status?: string;
}

export async function resolveSupplierItemsProcessed(args: {
  supplierReference: string;
  orderCodes: string[];
  status: "PROCESSED" | "PARTIALLY_PROCESSED" | "FAILED" | string;
  rawPayload?: unknown;
}): Promise<{ customerOrdersFulfilled: number; wholesaleItemsFulfilled: number }> {
  if (!hasSupabaseConfig()) {
    return { customerOrdersFulfilled: 0, wholesaleItemsFulfilled: 0 };
  }
  const service = createServiceClient();
  const now = new Date().toISOString();
  const isFulfilled = args.status !== "FAILED";

  let customerOrdersFulfilled = 0;
  let wholesaleItemsFulfilled = 0;

  if (args.orderCodes.length > 0) {
    const { data: customerHits } = await service
      .from("orders")
      .update({
        status: isFulfilled ? "fulfilled" : "failed",
        supplier_status: args.status,
        supplier_response: (args.rawPayload as object | undefined) ?? null,
        fulfilled_at: isFulfilled ? now : null,
      })
      .in("supplier_order_code", args.orderCodes)
      .select("id");
    customerOrdersFulfilled = (customerHits as unknown as { id: string }[] | null)?.length ?? 0;

    const { data: itemHits } = await service
      .from("wholesale_order_items")
      .update({
        status: isFulfilled ? "fulfilled" : "failed",
        supplier_status: args.status,
        supplier_response: (args.rawPayload as object | undefined) ?? null,
        supplier_fulfilled_at: isFulfilled ? now : null,
      })
      .in("supplier_order_code", args.orderCodes)
      .select("id, wholesale_order_id");
    wholesaleItemsFulfilled = (itemHits as unknown as { id: string }[] | null)?.length ?? 0;

    // Roll up parent wholesale_orders if all items are fulfilled
    const parentIds = Array.from(
      new Set(
        ((itemHits as unknown as { wholesale_order_id: string }[] | null) ?? []).map(
          (i) => i.wholesale_order_id,
        ),
      ),
    );
    for (const parentId of parentIds) {
      const { data: itemStatuses } = await service
        .from("wholesale_order_items")
        .select("status")
        .eq("wholesale_order_id", parentId);
      const rows = (itemStatuses ?? []) as { status: string }[];
      const allDone = rows.length > 0 && rows.every((r) => r.status === "fulfilled");
      const anyFailed = rows.some((r) => r.status === "failed");
      if (allDone) {
        await service
          .from("wholesale_orders")
          .update({ status: "fulfilled", fulfilled_at: now })
          .eq("id", parentId);
      } else if (anyFailed && rows.every((r) => ["fulfilled", "failed"].includes(r.status))) {
        await service
          .from("wholesale_orders")
          .update({ status: "failed" })
          .eq("id", parentId);
      }
    }
  }

  return { customerOrdersFulfilled, wholesaleItemsFulfilled };
}
