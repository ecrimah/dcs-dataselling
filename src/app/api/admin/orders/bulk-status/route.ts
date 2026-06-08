import { NextResponse, after } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { applyCustomerOrderStatus } from "@/lib/admin/customer-order-status";
import { syncWholesaleOrderFromItems } from "@/lib/admin/wholesale-order-sync";
import { tryCreditReferralForWholesaleItem } from "@/lib/referrals/vendor-referral";
import type { OrderStatus } from "@/lib/constants";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const customerStatuses = [
  "pending",
  "paid",
  "queued",
  "processing",
  "fulfilled",
  "failed",
  "refunded",
] as const;

const wholesaleItemStatuses = ["queued", "processing", "fulfilled", "failed"] as const;

const schema = z.object({
  kind: z.enum(["wholesale_item", "customer"]),
  ids: z.array(z.string().uuid()).min(1).max(200),
  status: z.string(),
});

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
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
  const parentOrderIds = new Set<string>();
  let updated = 0;
  const errors: string[] = [];

  if (body.kind === "wholesale_item") {
    const status = z.enum(wholesaleItemStatuses).safeParse(body.status);
    if (!status.success) {
      return NextResponse.json({ error: "Invalid wholesale item status" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      status: status.data,
    };
    if (status.data === "fulfilled") {
      updates.supplier_fulfilled_at = new Date().toISOString();
    }

    for (const id of body.ids) {
      const { data: row } = await service
        .from("wholesale_order_items")
        .select("wholesale_order_id")
        .eq("id", id)
        .maybeSingle();

      const { error } = await service
        .from("wholesale_order_items")
        .update(updates)
        .eq("id", id);

      if (error) {
        errors.push(`${id}: ${error.message}`);
        continue;
      }

      updated += 1;
      const orderId = (row as { wholesale_order_id?: string } | null)?.wholesale_order_id;
      if (orderId) parentOrderIds.add(orderId);
      if (status.data === "fulfilled") {
        after(() => tryCreditReferralForWholesaleItem(id));
      }
    }

    for (const orderId of parentOrderIds) {
      await syncWholesaleOrderFromItems(service, orderId);
    }
  } else {
    const status = z.enum(customerStatuses).safeParse(body.status);
    if (!status.success) {
      return NextResponse.json({ error: "Invalid customer order status" }, { status: 400 });
    }

    for (const id of body.ids) {
      const result = await applyCustomerOrderStatus(
        service,
        id,
        status.data as OrderStatus,
      );
      if (!result.ok) {
        errors.push(`${id}: ${result.error}`);
        continue;
      }
      updated += 1;
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    updated,
    failed: errors.length,
    errors: errors.slice(0, 10),
  });
}
