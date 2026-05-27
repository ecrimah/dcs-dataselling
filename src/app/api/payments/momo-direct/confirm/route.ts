import { NextResponse } from "next/server";
import { z } from "zod";

import {
  findSmsByTransactionId,
  linkSmsToOrder,
} from "@/lib/payments/momo-direct";
import { finalizeMomoDirectOrder } from "@/lib/payments/momo-direct-fulfilment";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  orderId: z.string().uuid(),
  transactionId: z.string().trim().min(4).max(40),
});

export const dynamic = "force-dynamic";

/**
 * Called from the order page after the customer types their MoMo transaction
 * ID. Three possible outcomes:
 *
 *   - match    → order flips to paid + queued, supplier dispatch starts.
 *   - waiting  → SMS hasn't arrived yet; we save the txn id on the order so
 *                the next forwarded SMS can match it automatically.
 *   - rejected → order already paid / not in awaiting_momo / amount mismatch.
 */
export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const txnId = body.transactionId.trim().toUpperCase();
  const service = createServiceClient();

  const { data: order } = await service
    .from("orders")
    .select("id, status, amount, payment_provider")
    .eq("id", body.orderId)
    .maybeSingle();

  const o = order as {
    id: string;
    status: string;
    amount: number | string;
    payment_provider: string | null;
  } | null;

  if (!o) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (o.payment_provider !== "momo_direct") {
    return NextResponse.json({ error: "Wrong payment method" }, { status: 400 });
  }
  if (o.status !== "awaiting_momo") {
    // Already paid / queued / fulfilled — tell the caller.
    return NextResponse.json({ status: o.status, alreadyProcessed: true });
  }

  // Save the typed transaction id on the order so a late-arriving webhook
  // can also auto-match this order via the same id.
  await service
    .from("orders")
    .update({ payment_reference: txnId })
    .eq("id", o.id);

  const sms = await findSmsByTransactionId(txnId);

  if (sms && (!sms.matched_order_id || sms.matched_order_id === o.id)) {
    const smsAmount = sms.amount != null ? Number(sms.amount) : null;
    const orderAmount = Number(o.amount);
    // Don't accept an undercharge.
    if (smsAmount != null && smsAmount + 0.01 < orderAmount) {
      return NextResponse.json(
        {
          status: "amount_mismatch",
          orderAmount,
          smsAmount,
          message: "We received a MoMo SMS with this transaction ID but the amount is short.",
        },
        { status: 400 },
      );
    }
    await linkSmsToOrder(sms.id, o.id);
    const finalized = await finalizeMomoDirectOrder(o.id, txnId);
    return NextResponse.json({ status: finalized ? "paid" : "already_processed" });
  }

  // SMS not yet received — customer should retry shortly.
  return NextResponse.json({ status: "waiting" });
}
