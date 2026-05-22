import { createServiceClient } from "@/lib/supabase/server";

import { corsPreflightResponse, handleApi } from "../../_lib/respond";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/orders/{reference}
 * Look up a single order by its reference. Includes line items so bots can
 * see per-recipient status.
 */
export const GET = handleApi(async ({ ctx, params }) => {
  const reference = params.reference;
  if (!reference) {
    return { status: 400, json: { error: "Reference required", code: "missing_reference" } };
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("wholesale_orders")
    .select(
      `
      id, reference, status, total_amount, item_count, source, created_at, paid_at, fulfilled_at,
      supplier, supplier_status, supplier_error,
      wholesale_order_items (
        id, recipient_phone, quantity, unit_price, line_total, status,
        supplier_order_code, supplier_status, supplier_error, supplier_fulfilled_at,
        wholesale_bundles ( sku, name, network, data_mb )
      )
    `,
    )
    .eq("vendor_id", ctx.vendorId)
    .eq("reference", reference)
    .maybeSingle();

  if (error) {
    return { status: 500, json: { error: "Lookup failed", code: "query_failed" } };
  }
  if (!data) {
    return { status: 404, json: { error: "Order not found", code: "not_found" } };
  }

  type Item = {
    id: string;
    recipient_phone: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    status: string;
    supplier_order_code: string | null;
    supplier_status: string | null;
    supplier_error: string | null;
    supplier_fulfilled_at: string | null;
    wholesale_bundles:
      | { sku: string; name: string; network: string; data_mb: number }
      | { sku: string; name: string; network: string; data_mb: number }[]
      | null;
  };
  type Order = {
    id: string;
    reference: string;
    status: string;
    total_amount: number;
    item_count: number;
    source: string;
    created_at: string;
    paid_at: string | null;
    fulfilled_at: string | null;
    supplier: string | null;
    supplier_status: string | null;
    supplier_error: string | null;
    wholesale_order_items: Item[];
  };
  const o = data as Order;

  return {
    json: {
      order: {
        id: o.id,
        reference: o.reference,
        status: o.status,
        supplier: o.supplier,
        supplier_status: o.supplier_status,
        supplier_error: o.supplier_error,
        source: o.source,
        item_count: o.item_count,
        total: Number(o.total_amount),
        created_at: o.created_at,
        paid_at: o.paid_at,
        fulfilled_at: o.fulfilled_at,
        items: (o.wholesale_order_items ?? []).map((it) => {
          const b = Array.isArray(it.wholesale_bundles)
            ? it.wholesale_bundles[0]
            : it.wholesale_bundles;
          return {
            id: it.id,
            recipient_phone: it.recipient_phone,
            quantity: it.quantity,
            unit_price: Number(it.unit_price),
            line_total: Number(it.line_total),
            status: it.status,
            supplier_status: it.supplier_status,
            supplier_error: it.supplier_error,
            supplier_order_code: it.supplier_order_code,
            fulfilled_at: it.supplier_fulfilled_at,
            bundle: b
              ? {
                  sku: b.sku,
                  name: b.name,
                  network: b.network,
                  data_mb: b.data_mb,
                }
              : null,
          };
        }),
      },
    },
    responseSummary: { reference: o.reference, status: o.status },
  };
});

export function OPTIONS() {
  return corsPreflightResponse();
}
