import { NextResponse } from "next/server";
import crypto from "crypto";
import { markSetupPaymentPaid } from "@/lib/payments/setup-fee";
import { markWalletTopupPaid } from "@/lib/payments/wallet";
import { markWholesaleOrderPaid } from "@/lib/payments/wholesale-order";
import { smsOrderPaymentReceived, smsWalletTopup } from "@/lib/notifications/sms";
import { formatDataAmount } from "@/lib/format";
import { dispatchCustomerOrderToSupplier } from "@/lib/suppliers/dispatch";
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

    if (meta.type === "wholesale_order") {
      await markWholesaleOrderPaid(event.data.reference, event.data.reference);
      return NextResponse.json({ received: true });
    }

    if (meta.type === "wallet_topup") {
      const topup = await markWalletTopupPaid(event.data.reference, event.data.reference);
      if (topup && topup.notifyPhone) {
        void smsWalletTopup({
          phone: topup.notifyPhone,
          amount: topup.amount,
          reference: topup.reference,
          context: { vendor_id: topup.vendorId },
        });
      }
      return NextResponse.json({ received: true });
    }

    const { data: order } = await service
      .from("orders")
      .select(
        `
        id, status, reference, recipient_phone,
        bundles ( name, data_mb )
      `,
      )
      .eq("reference", event.data.reference)
      .maybeSingle();

    if (order && order.status === "pending") {
      const o = order as {
        id: string;
        status: string;
        reference: string;
        recipient_phone: string;
        bundles: { name: string; data_mb: number } | { name: string; data_mb: number }[] | null;
      };
      const bundle = Array.isArray(o.bundles) ? o.bundles[0] : o.bundles;
      const bundleLabel = bundle
        ? `${formatDataAmount(bundle.data_mb)} ${bundle.name}`
        : "data";

      await service
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_reference: event.data.reference,
        })
        .eq("id", o.id);

      await service.from("transactions").insert({
        order_id: o.id,
        provider: "paystack",
        provider_reference: event.data.reference,
        amount: event.data.amount / 100,
        status: event.data.status,
        raw_payload: event.data,
      });

      await service.from("orders").update({ status: "queued" }).eq("id", o.id);

      void smsOrderPaymentReceived({
        phone: o.recipient_phone,
        reference: o.reference,
        bundleLabel,
      });

      // Fire-and-forget dispatch to supplier (Skanka5). If it fails, the order
      // stays `queued` with supplier_error set so admin can retry.
      void dispatchCustomerOrderToSupplier(o.id);
    }
  }

  return NextResponse.json({ received: true });
}
