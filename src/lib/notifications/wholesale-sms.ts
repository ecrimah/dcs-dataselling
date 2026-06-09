import "server-only";

import { formatDataAmount } from "@/lib/format";
import { smsWholesaleDelivered, smsWholesaleVendorFulfilled } from "@/lib/notifications/sms";
import { getVendorNotifyPhone } from "@/lib/payments/wallet";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

/**
 * Has a successful SMS for this template already been logged against the given
 * context key? Lets us re-run fulfillment (webhook replays, admin bulk edits)
 * without sending duplicate notifications.
 */
async function alreadyNotified(
  template: string,
  key: "item_id" | "wholesale_order_id",
  value: string,
): Promise<boolean> {
  if (!hasSupabaseConfig()) return true;
  const service = createServiceClient();
  const { data } = await service
    .from("sms_logs")
    .select("id")
    .eq("template", template)
    .eq("status", "sent")
    .eq(`context->>${key}`, value)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

/** SMS the recipient of a fulfilled wholesale line that their data is delivered. */
export async function notifyWholesaleItemDelivered(itemId: string): Promise<void> {
  if (!hasSupabaseConfig()) return;
  const service = createServiceClient();

  const { data } = await service
    .from("wholesale_order_items")
    .select(
      `
      id, recipient_phone, status,
      wholesale_orders ( reference ),
      wholesale_bundles ( name, data_mb )
    `,
    )
    .eq("id", itemId)
    .maybeSingle();

  const row = data as {
    id: string;
    recipient_phone: string | null;
    status: string;
    wholesale_orders: { reference: string } | { reference: string }[] | null;
    wholesale_bundles:
      | { name: string; data_mb: number }
      | { name: string; data_mb: number }[]
      | null;
  } | null;

  if (!row || row.status !== "fulfilled" || !row.recipient_phone) return;
  if (await alreadyNotified("wholesale_delivered", "item_id", itemId)) return;

  const order = Array.isArray(row.wholesale_orders) ? row.wholesale_orders[0] : row.wholesale_orders;
  const bundle = Array.isArray(row.wholesale_bundles)
    ? row.wholesale_bundles[0]
    : row.wholesale_bundles;
  const bundleLabel = bundle ? `${formatDataAmount(bundle.data_mb)} ${bundle.name}` : "data";

  await smsWholesaleDelivered({
    phone: row.recipient_phone,
    bundleLabel,
    reference: order?.reference ?? "",
    context: { item_id: itemId },
  });
}

/** SMS the vendor that their wholesale order has been fully delivered. */
export async function notifyVendorWholesaleFulfilled(wholesaleOrderId: string): Promise<void> {
  if (!hasSupabaseConfig()) return;
  const service = createServiceClient();

  const { data } = await service
    .from("wholesale_orders")
    .select("id, reference, vendor_id, status, item_count, total_amount")
    .eq("id", wholesaleOrderId)
    .maybeSingle();

  const order = data as {
    id: string;
    reference: string;
    vendor_id: string;
    status: string;
    item_count: number | null;
    total_amount: number | string | null;
  } | null;

  if (!order || order.status !== "fulfilled") return;
  if (await alreadyNotified("wholesale_vendor_fulfilled", "wholesale_order_id", wholesaleOrderId)) {
    return;
  }

  const phone = await getVendorNotifyPhone(order.vendor_id);
  if (!phone) return;

  await smsWholesaleVendorFulfilled({
    phone,
    reference: order.reference,
    itemCount: Number(order.item_count ?? 0),
    totalAmount: Number(order.total_amount ?? 0),
    context: { wholesale_order_id: wholesaleOrderId },
  });
}
