import { NextResponse } from "next/server";
import { z } from "zod";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { fetchWholesaleCatalogue } from "@/lib/data/wholesale";
import { resolveAgentBuyPrice } from "@/lib/wholesale/tier-pricing";
import {
  parseBulkOrders,
  validBulkRows,
  type BulkNetworkKey,
} from "@/lib/wholesale/bulk-parse";
import { debitVendorWallet, getOrCreateVendorWallet } from "@/lib/payments/wallet";
import {
  createWholesaleOrder,
  markWholesaleOrderPaid,
} from "@/lib/payments/wholesale-order";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const bulkSchema = z.object({
  networkKey: z.enum(["mtn", "telecel", "at-ishare", "at-bigtime"]).optional(),
  orders: z.string().min(1).optional(),
  csv: z.string().min(1).optional(),
  confirm: z.boolean().optional(),
});

function mapPreviewRow(
  r: ReturnType<typeof parseBulkOrders>[number],
  tier: Parameters<typeof resolveAgentBuyPrice>[1],
) {
  const unit = r.bundle ? resolveAgentBuyPrice(r.bundle, tier) : 0;
  return {
    row: r.row,
    phone: r.phone,
    sku: r.sku ?? r.bundle?.sku,
    bundleName: r.bundle?.name,
    sizeLabel: r.sizeLabel,
    dataMb: r.bundle?.dataMb,
    quantity: r.quantity,
    lineTotal: r.bundle ? +(unit * r.quantity).toFixed(2) : 0,
    error: r.error,
  };
}

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  try {
    const body = bulkSchema.parse(await request.json());
    const text = (body.orders ?? body.csv ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "No orders provided" }, { status: 400 });
    }

    const catalogue = await fetchWholesaleCatalogue();
    const networkKey = body.networkKey as BulkNetworkKey | undefined;

    if (!networkKey && !body.csv) {
      return NextResponse.json({ error: "Select a network for bulk orders" }, { status: 400 });
    }

    const parsed = parseBulkOrders(text, catalogue, networkKey);
    const valid = validBulkRows(parsed);
    const invalid = parsed.filter((r) => r.error);

    if (!body.confirm) {
      const total = valid.reduce(
        (s, r) => s + resolveAgentBuyPrice(r.bundle!, ctx.tier) * r.quantity,
        0,
      );
      return NextResponse.json({
        preview: true,
        validCount: valid.length,
        invalidCount: invalid.length,
        totalAmount: +total.toFixed(2),
        rows: parsed.map((r) => mapPreviewRow(r, ctx.tier)),
      });
    }

    if (valid.length === 0) {
      return NextResponse.json({ error: "No valid rows to order" }, { status: 400 });
    }

    const order = await createWholesaleOrder({
      vendorId: ctx.vendorId,
      source: "bulk",
      items: valid.map((r) => ({
        wholesaleBundleId: r.bundle!.id,
        recipientPhone: r.phone,
        unitPrice: resolveAgentBuyPrice(r.bundle!, ctx.tier),
        quantity: r.quantity,
      })),
    });

    const total = Number(order.total_amount);
    const wallet = await getOrCreateVendorWallet(ctx.vendorId);
    if (wallet.balance < total) {
      await createServiceClient().from("wholesale_orders").delete().eq("id", order.id);
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

    const debited = await debitVendorWallet(
      ctx.vendorId,
      total,
      order.reference,
      `Bulk wholesale order ${order.reference}`,
    );

    if (!debited) {
      await createServiceClient().from("wholesale_orders").delete().eq("id", order.id);
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
      reference: order.reference,
      orderId: order.id,
      itemCount: valid.reduce((s, r) => s + r.quantity, 0),
      total,
      balance: updatedWallet.balance,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[wholesale_order_bulk]", e);
    return NextResponse.json({ error: "Could not process bulk order" }, { status: 500 });
  }
}
