import "server-only";

import { dispatchCustomerOrderToSupplier } from "@/lib/suppliers/dispatch";
import { smsOrderPaymentReceived } from "@/lib/notifications/sms";
import { formatDataAmount } from "@/lib/format";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

/**
 * Flip an awaiting_momo order to paid → queued, write a transaction row,
 * send the payment-received SMS, and dispatch to Skanka5.
 *
 * Idempotent: if the order has already moved past awaiting_momo this is a
 * no-op so duplicate matches (admin manual + auto webhook race) are safe.
 */
export async function finalizeMomoDirectOrder(orderId: string, transactionId: string): Promise<boolean> {
  if (!hasSupabaseConfig()) return false;
  const service = createServiceClient();

  const { data: order } = await service
    .from("orders")
    .select(
      `
      id, reference, status, recipient_phone, amount,
      bundles ( name, data_mb )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  type Row = {
    id: string;
    reference: string;
    status: string;
    recipient_phone: string;
    amount: number | string;
    bundles:
      | { name: string; data_mb: number }
      | { name: string; data_mb: number }[]
      | null;
  };
  const o = order as Row | null;
  if (!o) return false;

  // Only act on orders still awaiting MoMo confirmation.
  if (o.status !== "awaiting_momo") return false;

  const bundle = Array.isArray(o.bundles) ? o.bundles[0] : o.bundles;
  const bundleLabel = bundle
    ? `${formatDataAmount(bundle.data_mb)} ${bundle.name}`
    : "data";

  const nowIso = new Date().toISOString();

  // Status guard ensures concurrent matches don't double-process.
  const { data: updated, error: updateErr } = await service
    .from("orders")
    .update({
      status: "paid",
      paid_at: nowIso,
      payment_reference: transactionId,
    })
    .eq("id", o.id)
    .eq("status", "awaiting_momo")
    .select("id")
    .maybeSingle();

  if (updateErr || !updated) {
    // Lost the race to another caller — that's fine.
    return false;
  }

  await service.from("transactions").insert({
    order_id: o.id,
    provider: "momo_direct",
    provider_reference: transactionId,
    amount: Number(o.amount),
    status: "success",
    raw_payload: { source: "momo_direct" },
  });

  await service.from("orders").update({ status: "queued" }).eq("id", o.id);

  void smsOrderPaymentReceived({
    phone: o.recipient_phone,
    reference: o.reference,
    bundleLabel,
  });

  void dispatchCustomerOrderToSupplier(o.id);

  return true;
}
