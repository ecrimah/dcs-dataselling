import { NextResponse } from "next/server";

import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { smsOrderFulfilled } from "@/lib/notifications/sms";
import { formatDataAmount } from "@/lib/format";
import { logWebhookEvent, verifyWebhookSignature } from "@/lib/suppliers/skanka5";
import { resolveSupplierItemsProcessed } from "@/lib/suppliers/dispatch";

/**
 * Skanka5 webhook receiver.
 *
 * Payload shape (grouped processed items):
 *   {
 *     "event": "order.items_processed",
 *     "reference": "ORDER-000123",
 *     "status": "PROCESSED" | "PARTIALLY_PROCESSED" | "FAILED",
 *     "items": [{ "order_code": "MTN-...", "msisdn": "...", "status": "..." }, ...]
 *   }
 *
 * Signature: X-Skanka5-Signature = HMAC-SHA256(rawBody, SKANKA5_WEBHOOK_SECRET)
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-skanka5-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    await logWebhookEvent({
      ok: false,
      error: "Invalid signature",
      payload: { signature_header: signature, body_snippet: rawBody.slice(0, 200) },
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    reference?: string;
    status?: string;
    items?: Array<{ order_code?: string; msisdn?: string; status?: string }>;
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    await logWebhookEvent({
      ok: false,
      error: "Invalid JSON",
      payload: { body_snippet: rawBody.slice(0, 200) },
    });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event !== "order.items_processed") {
    await logWebhookEvent({
      ok: true,
      payload: event,
      error: `Ignored event: ${event.event ?? "unknown"}`,
    });
    return NextResponse.json({ received: true, ignored: true });
  }

  const orderCodes = (event.items ?? [])
    .map((i) => i.order_code)
    .filter((c): c is string => typeof c === "string" && c.length > 0);

  if (orderCodes.length === 0) {
    await logWebhookEvent({
      ok: false,
      error: "No order_code in items",
      supplierReference: event.reference,
      payload: event,
    });
    return NextResponse.json({ received: true, processed: 0 });
  }

  const result = await resolveSupplierItemsProcessed({
    supplierReference: event.reference ?? "",
    orderCodes,
    status: event.status ?? "PROCESSED",
    rawPayload: event,
  });

  await logWebhookEvent({
    ok: true,
    supplierReference: event.reference,
    payload: event,
    error:
      result.customerOrdersFulfilled + result.wholesaleItemsFulfilled === 0
        ? "No matching orders updated"
        : null,
  });

  // Send delivery SMS to any matched customer storefront orders (we only do
  // this for fully PROCESSED items; FAILED items are surfaced via supplier_error).
  if (hasSupabaseConfig() && result.customerOrdersFulfilled > 0 && event.status !== "FAILED") {
    const service = createServiceClient();
    const { data: rows } = await service
      .from("orders")
      .select(
        `
        reference, recipient_phone,
        bundles ( name, data_mb )
      `,
      )
      .in("supplier_order_code", orderCodes);

    type Row = {
      reference: string;
      recipient_phone: string;
      bundles:
        | { name: string; data_mb: number }
        | { name: string; data_mb: number }[]
        | null;
    };
    for (const r of (rows ?? []) as Row[]) {
      const bundle = Array.isArray(r.bundles) ? r.bundles[0] : r.bundles;
      const bundleLabel = bundle
        ? `${formatDataAmount(bundle.data_mb)} ${bundle.name}`
        : "data";
      void smsOrderFulfilled({
        phone: r.recipient_phone,
        reference: r.reference,
        bundleLabel,
      });
    }
  }

  return NextResponse.json({
    received: true,
    customer_orders_updated: result.customerOrdersFulfilled,
    wholesale_items_updated: result.wholesaleItemsFulfilled,
  });
}
