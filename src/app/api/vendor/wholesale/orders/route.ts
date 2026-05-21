import { NextResponse } from "next/server";
import { z } from "zod";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import {
  createWholesaleOrder,
  fetchWholesaleBundleById,
  initializeWholesalePaystack,
} from "@/lib/payments/wholesale-order";
import { hasSupabaseConfig } from "@/lib/supabase/server";

const singleSchema = z.object({
  wholesaleBundleId: z.string().uuid(),
  recipientPhone: z.string().min(9).max(20),
  quantity: z.number().int().min(1).max(100).optional(),
});

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  try {
    const body = singleSchema.parse(await request.json());
    const phone = body.recipientPhone.replace(/\D/g, "");
    const normalized =
      phone.length === 10 && phone.startsWith("0")
        ? phone
        : phone.length === 12 && phone.startsWith("233")
          ? `0${phone.slice(3)}`
          : phone.length === 9
            ? `0${phone}`
            : null;

    if (!normalized) {
      return NextResponse.json({ error: "Enter a valid Ghana phone number" }, { status: 400 });
    }

    const bundle = await fetchWholesaleBundleById(body.wholesaleBundleId);
    if (!bundle) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const quantity = body.quantity ?? 1;
    const order = await createWholesaleOrder({
      vendorId: ctx.vendorId,
      source: "single",
      items: [
        {
          wholesaleBundleId: bundle.id,
          recipientPhone: normalized,
          unitPrice: bundle.wholesalePrice,
          quantity,
        },
      ],
    });

    const authUrl = await initializeWholesalePaystack({
      email: ctx.email ?? `vendor@${process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") ?? "dcselite.com"}`,
      orderId: order.id,
      reference: order.reference,
      amount: Number(order.total_amount),
    });

    if (!authUrl) {
      return NextResponse.json(
        {
          error: "Paystack is not configured. Add PAYSTACK_SECRET_KEY to enable payments.",
          orderId: order.id,
          reference: order.reference,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      authorizationUrl: authUrl,
      reference: order.reference,
      orderId: order.id,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[wholesale_order_single]", e);
    return NextResponse.json({ error: "Could not place order" }, { status: 500 });
  }
}
