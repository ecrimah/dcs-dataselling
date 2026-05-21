import { NextResponse } from "next/server";
import { z } from "zod";

import { assertAdminApi } from "@/lib/auth/admin-api";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import {
  dispatchCustomerOrderToSupplier,
  dispatchWholesaleOrderToSupplier,
} from "@/lib/suppliers/dispatch";

const schema = z.object({
  scope: z.enum(["customer_order", "wholesale_order"]),
  orderId: z.string().uuid(),
});

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

  // Clear the existing supplier_reference / error so dispatch re-runs.
  if (body.scope === "customer_order") {
    await service
      .from("orders")
      .update({
        supplier_reference: null,
        supplier_order_code: null,
        supplier_status: null,
        supplier_error: null,
      })
      .eq("id", body.orderId);
    await dispatchCustomerOrderToSupplier(body.orderId);
  } else {
    await service
      .from("wholesale_orders")
      .update({
        supplier_reference: null,
        supplier_status: null,
        supplier_error: null,
      })
      .eq("id", body.orderId);
    await service
      .from("wholesale_order_items")
      .update({
        supplier_order_code: null,
        supplier_status: null,
        supplier_error: null,
      })
      .eq("wholesale_order_id", body.orderId);
    await dispatchWholesaleOrderToSupplier(body.orderId);
  }

  return NextResponse.json({ ok: true });
}
