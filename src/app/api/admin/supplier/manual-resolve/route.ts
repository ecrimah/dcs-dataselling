import { NextResponse } from "next/server";
import { z } from "zod";

import { assertAdminApi } from "@/lib/auth/admin-api";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { smsOrderFulfilled } from "@/lib/notifications/sms";
import { formatDataAmount } from "@/lib/format";
import { tryCreditReferralForCustomerOrder } from "@/lib/referrals/vendor-referral";

const schema = z.object({
  orderId: z.string().uuid(),
  outcome: z.enum(["fulfilled", "failed"]),
  note: z.string().max(500).optional(),
});

/**
 * Resolve an order that was queued for manual fulfilment (no automated supplier
 * configured for its network). Admin can confirm the recharge was sent
 * (outcome=fulfilled, customer is SMS'd) or mark it failed (so they can refund).
 */
export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await assertAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const service = createServiceClient();
  const now = new Date().toISOString();

  const { data: row, error } = await service
    .from("orders")
    .select(
      `
      id, reference, status, recipient_phone, supplier_status,
      bundles ( name, data_mb )
    `,
    )
    .eq("id", body.orderId)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  type Row = {
    id: string;
    reference: string;
    status: string;
    recipient_phone: string;
    supplier_status: string | null;
    bundles:
      | { name: string; data_mb: number }
      | { name: string; data_mb: number }[]
      | null;
  };
  const o = row as Row;

  if (o.supplier_status !== "awaiting_manual") {
    return NextResponse.json(
      {
        error: `Order is not awaiting manual fulfilment (status: ${o.supplier_status ?? "none"})`,
      },
      { status: 409 },
    );
  }

  if (body.outcome === "fulfilled") {
    await service
      .from("orders")
      .update({
        status: "fulfilled",
        supplier_status: "manual_fulfilled",
        supplier_error: body.note ?? null,
        supplier_submitted_at: now,
        fulfilled_at: now,
      })
      .eq("id", o.id);

    const bundle = Array.isArray(o.bundles) ? o.bundles[0] : o.bundles;
    const bundleLabel = bundle
      ? `${formatDataAmount(bundle.data_mb)} ${bundle.name}`
      : "data";
    void smsOrderFulfilled({
      phone: o.recipient_phone,
      reference: o.reference,
      bundleLabel,
    });

    void tryCreditReferralForCustomerOrder(o.id);

    await service.from("supplier_logs").insert({
      supplier: "manual",
      event_type: "manual_resolved",
      scope: "customer_order",
      reference: o.reference,
      supplier_reference: null,
      http_status: null,
      ok: true,
      error: null,
      request_payload: { outcome: "fulfilled", note: body.note ?? null, resolved_by: auth.userId },
      response_payload: null,
    });

    return NextResponse.json({ ok: true, outcome: "fulfilled" });
  }

  await service
    .from("orders")
    .update({
      status: "failed",
      supplier_status: "manual_failed",
      supplier_error: body.note ?? "Marked failed by admin",
      supplier_submitted_at: now,
    })
    .eq("id", o.id);

  await service.from("supplier_logs").insert({
    supplier: "manual",
    event_type: "manual_resolved",
    scope: "customer_order",
    reference: o.reference,
    supplier_reference: null,
    http_status: null,
    ok: false,
    error: body.note ?? "Marked failed by admin",
    request_payload: { outcome: "failed", note: body.note ?? null, resolved_by: auth.userId },
    response_payload: null,
  });

  return NextResponse.json({ ok: true, outcome: "failed" });
}
