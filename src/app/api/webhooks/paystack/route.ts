import { NextResponse } from "next/server";
import crypto from "crypto";
import { markSetupPaymentPaid } from "@/lib/payments/setup-fee";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const signature = request.headers.get("x-paystack-signature");
  const body = await request.text();

  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body) as {
    event: string;
    data: {
      reference: string;
      status: string;
      amount: number;
      metadata?: Record<string, string>;
    };
  };

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ received: true, note: "DB not configured" });
  }

  const service = createServiceClient();

  if (event.event === "charge.success") {
    const meta = event.data.metadata ?? {};
    if (meta.type === "vendor_setup") {
      await markSetupPaymentPaid(event.data.reference, event.data.reference);
      return NextResponse.json({ received: true });
    }

    const { data: order } = await service
      .from("orders")
      .select("id, status")
      .eq("reference", event.data.reference)
      .maybeSingle();

    if (order && order.status === "pending") {
      await service
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_reference: event.data.reference,
        })
        .eq("id", order.id);

      await service.from("transactions").insert({
        order_id: order.id,
        provider: "paystack",
        provider_reference: event.data.reference,
        amount: event.data.amount / 100,
        status: event.data.status,
        raw_payload: event.data,
      });

      // Auto-queue for fulfilment
      await service
        .from("orders")
        .update({ status: "queued" })
        .eq("id", order.id);
    }
  }

  return NextResponse.json({ received: true });
}
