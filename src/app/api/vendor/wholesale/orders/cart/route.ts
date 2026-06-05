import { NextResponse } from "next/server";
import { z } from "zod";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { fetchWholesaleCatalogue } from "@/lib/data/wholesale";
import { resolveAgentBuyPrice } from "@/lib/wholesale/tier-pricing";
import { debitVendorWallet, getOrCreateVendorWallet } from "@/lib/payments/wallet";
import {
  createWholesaleOrder,
  markWholesaleOrderPaid,
} from "@/lib/payments/wholesale-order";
import { assertRecipientsNotOnCooldown } from "@/lib/orders/recipient-cooldown";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const itemSchema = z.object({
  wholesaleBundleId: z.string().uuid(),
  recipientPhone: z.string().min(9).max(20),
  quantity: z.number().int().min(1).max(100).optional(),
});

const schema = z.object({
  items: z.array(itemSchema).min(1).max(500),
});

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return digits;
  if (digits.length === 12 && digits.startsWith("233")) return `0${digits.slice(3)}`;
  if (digits.length === 9) return `0${digits}`;
  return null;
}

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  try {
    const body = schema.parse(await request.json());
    const catalogue = await fetchWholesaleCatalogue();
    const byId = new Map(catalogue.map((b) => [b.id, b]));

    const orderItems: {
      wholesaleBundleId: string;
      recipientPhone: string;
      unitPrice: number;
      quantity: number;
    }[] = [];

    for (const item of body.items) {
      const phone = normalizePhone(item.recipientPhone);
      const bundle = byId.get(item.wholesaleBundleId);
      if (!phone) {
        return NextResponse.json({ error: "Invalid phone number in cart" }, { status: 400 });
      }
      if (!bundle) {
        return NextResponse.json({ error: "Product no longer available" }, { status: 400 });
      }
      orderItems.push({
        wholesaleBundleId: bundle.id,
        recipientPhone: phone,
        unitPrice: resolveAgentBuyPrice(bundle, ctx.tier),
        quantity: item.quantity ?? 1,
      });
    }

    const cooldown = await assertRecipientsNotOnCooldown(
      orderItems.map((i) => i.recipientPhone),
    );
    if (!cooldown.ok) {
      return NextResponse.json({ error: cooldown.message }, { status: 409 });
    }

    const total = +orderItems
      .reduce((s, i) => s + i.unitPrice * i.quantity, 0)
      .toFixed(2);

    const wallet = await getOrCreateVendorWallet(ctx.vendorId);
    if (wallet.balance < total) {
      return NextResponse.json(
        {
          error: "Insufficient wallet balance",
          balance: wallet.balance,
          required: total,
          shortfall: +(total - wallet.balance).toFixed(2),
        },
        { status: 402 },
      );
    }

    const order = await createWholesaleOrder({
      vendorId: ctx.vendorId,
      source: orderItems.length > 1 ? "bulk" : "single",
      items: orderItems,
    });

    const debited = await debitVendorWallet(
      ctx.vendorId,
      total,
      order.reference,
      `Wholesale order ${order.reference}`,
    );

    if (!debited) {
      const service = createServiceClient();
      await service.from("wholesale_orders").delete().eq("id", order.id);
      return NextResponse.json({ error: "Wallet debit failed — try again" }, { status: 409 });
    }

    await markWholesaleOrderPaid(order.reference, "wallet");
    await createServiceClient()
      .from("wholesale_orders")
      .update({ payment_provider: "wallet" })
      .eq("id", order.id);

    const updatedWallet = await getOrCreateVendorWallet(ctx.vendorId);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      reference: order.reference,
      total,
      balance: updatedWallet.balance,
      itemCount: orderItems.reduce((s, i) => s + i.quantity, 0),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
    }
    console.error("[cart_checkout]", e);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
