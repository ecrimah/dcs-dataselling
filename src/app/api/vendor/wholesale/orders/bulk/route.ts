import { NextResponse } from "next/server";
import { z } from "zod";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { fetchWholesaleCatalogue } from "@/lib/data/wholesale";
import { debitVendorWallet, getOrCreateVendorWallet } from "@/lib/payments/wallet";
import {
  createWholesaleOrder,
  markWholesaleOrderPaid,
} from "@/lib/payments/wholesale-order";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { parseBulkOrderCsv, validBulkRows } from "@/lib/wholesale/bulk-parse";

const bulkSchema = z.object({
  csv: z.string().min(1),
  confirm: z.boolean().optional(),
});

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  try {
    const body = bulkSchema.parse(await request.json());
    const catalogue = await fetchWholesaleCatalogue();
    const parsed = parseBulkOrderCsv(body.csv, catalogue);
    const valid = validBulkRows(parsed);
    const invalid = parsed.filter((r) => r.error);

    if (!body.confirm) {
      const total = valid.reduce(
        (s, r) => s + r.bundle!.wholesalePrice * r.quantity,
        0,
      );
      return NextResponse.json({
        preview: true,
        validCount: valid.length,
        invalidCount: invalid.length,
        totalAmount: +total.toFixed(2),
        rows: parsed.map((r) => ({
          row: r.row,
          phone: r.phone,
          sku: r.sku ?? r.bundle?.sku,
          bundleName: r.bundle?.name,
          quantity: r.quantity,
          lineTotal: r.bundle ? +(r.bundle.wholesalePrice * r.quantity).toFixed(2) : 0,
          error: r.error,
        })),
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
        unitPrice: r.bundle!.wholesalePrice,
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
