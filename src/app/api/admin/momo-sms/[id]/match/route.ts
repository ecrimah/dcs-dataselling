import { NextResponse } from "next/server";
import { z } from "zod";

import { assertAdminApi } from "@/lib/auth/admin-api";
import { linkSmsToOrder } from "@/lib/payments/momo-direct";
import { finalizeMomoDirectOrder } from "@/lib/payments/momo-direct-fulfilment";
import { createServiceClient } from "@/lib/supabase/server";

const schema = z.object({ orderId: z.string().uuid() });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await assertAdminApi();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { id } = await params;
  const service = createServiceClient();

  const { data: sms } = await service
    .from("momo_sms")
    .select("id, transaction_id, amount, matched_order_id")
    .eq("id", id)
    .maybeSingle();

  type SmsRow = {
    id: string;
    transaction_id: string | null;
    amount: number | string | null;
    matched_order_id: string | null;
  };
  const row = sms as SmsRow | null;
  if (!row) return NextResponse.json({ error: "SMS not found" }, { status: 404 });
  if (row.matched_order_id) {
    return NextResponse.json({ error: "Already matched" }, { status: 400 });
  }
  if (!row.transaction_id) {
    return NextResponse.json(
      { error: "This SMS has no transaction id — can't safely match" },
      { status: 400 },
    );
  }

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
  if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (o.payment_provider !== "momo_direct") {
    return NextResponse.json({ error: "Order is not a MoMo direct order" }, { status: 400 });
  }
  if (o.status !== "awaiting_momo") {
    return NextResponse.json({ error: `Order is already ${o.status}` }, { status: 400 });
  }

  await linkSmsToOrder(row.id, o.id);
  await service
    .from("orders")
    .update({ payment_reference: row.transaction_id })
    .eq("id", o.id);
  const finalized = await finalizeMomoDirectOrder(o.id, row.transaction_id);

  return NextResponse.json({ ok: true, finalized });
}
