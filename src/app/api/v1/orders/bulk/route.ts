import { z } from "zod";

import { fetchWholesaleCatalogue } from "@/lib/data/wholesale";
import { resolveAgentBuyPrice } from "@/lib/wholesale/tier-pricing";
import { debitVendorWallet, getOrCreateVendorWallet } from "@/lib/payments/wallet";
import {
  createWholesaleOrder,
  markWholesaleOrderPaid,
} from "@/lib/payments/wholesale-order";
import { createServiceClient } from "@/lib/supabase/server";

import { corsPreflightResponse, handleApi, normalizeGhanaPhone } from "../../_lib/respond";

export const dynamic = "force-dynamic";

const itemSchema = z
  .object({
    sku: z.string().optional(),
    bundle_id: z.string().uuid().optional(),
    recipient_phone: z.string().min(9).max(20),
    quantity: z.number().int().min(1).max(100).optional(),
  })
  .refine((d) => Boolean(d.sku) || Boolean(d.bundle_id), {
    message: "Each item needs 'sku' or 'bundle_id'",
  });

const bulkSchema = z.object({
  items: z.array(itemSchema).min(1).max(500),
  reference: z.string().max(80).optional(),
  dry_run: z.boolean().optional(),
});

/**
 * POST /api/v1/orders/bulk
 * Submit up to 500 line items in one call. Wallet is debited once for the
 * full amount. Each line is fulfilled independently by its network's
 * supplier — partial failures don't block the rest.
 *
 * Pass `dry_run: true` to get a price preview without charging.
 * Pass `reference` to make the call idempotent.
 */
export const POST = handleApi(async ({ ctx, body }) => {
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      json: { error: "Invalid request", code: "invalid_body", issues: parsed.error.issues },
    };
  }
  const input = parsed.data;

  const catalogue = await fetchWholesaleCatalogue(true);
  const byId = new Map(catalogue.map((b) => [b.id, b]));
  const bySku = new Map(catalogue.map((b) => [b.sku.toLowerCase(), b]));

  interface ResolvedItem {
    bundleId: string;
    sku: string;
    name: string;
    network: string;
    dataMb: number;
    unitPrice: number;
    quantity: number;
    phone: string;
    lineTotal: number;
  }

  const resolved: ResolvedItem[] = [];
  const errors: Array<{ index: number; error: string }> = [];

  input.items.forEach((it, i) => {
    const bundle = it.bundle_id
      ? byId.get(it.bundle_id)
      : it.sku
        ? bySku.get(it.sku.toLowerCase())
        : undefined;
    if (!bundle) {
      errors.push({ index: i, error: "Bundle not found" });
      return;
    }
    const phone = normalizeGhanaPhone(it.recipient_phone);
    if (!phone) {
      errors.push({ index: i, error: "Invalid Ghana phone number" });
      return;
    }
    const quantity = it.quantity ?? 1;
    const unitPrice = resolveAgentBuyPrice(bundle, ctx.vendorTier);
    resolved.push({
      bundleId: bundle.id,
      sku: bundle.sku,
      name: bundle.name,
      network: bundle.network,
      dataMb: bundle.dataMb,
      unitPrice,
      quantity,
      phone,
      lineTotal: +(unitPrice * quantity).toFixed(2),
    });
  });

  const total = +resolved.reduce((s, r) => s + r.lineTotal, 0).toFixed(2);
  const wallet = await getOrCreateVendorWallet(ctx.vendorId);

  if (input.dry_run) {
    return {
      json: {
        dry_run: true,
        valid_count: resolved.length,
        invalid_count: errors.length,
        total,
        wallet_balance: wallet.balance,
        sufficient_funds: wallet.balance >= total,
        lines: resolved,
        errors,
      },
      responseSummary: { total, valid: resolved.length, invalid: errors.length },
    };
  }

  if (resolved.length === 0) {
    return {
      status: 400,
      json: { error: "No valid items", code: "no_valid_items", errors },
    };
  }

  if (wallet.balance < total) {
    return {
      status: 402,
      json: {
        error: "Insufficient wallet balance",
        code: "insufficient_funds",
        balance: wallet.balance,
        required: total,
        shortfall: +(total - wallet.balance).toFixed(2),
      },
    };
  }

  const service = createServiceClient();

  if (input.reference) {
    const { data: existing } = await service
      .from("wholesale_orders")
      .select("id, reference, status, total_amount, item_count, created_at, supplier_status")
      .eq("vendor_id", ctx.vendorId)
      .eq("reference", input.reference)
      .maybeSingle();
    if (existing) {
      const e = existing as {
        id: string;
        reference: string;
        status: string;
        total_amount: number;
        item_count: number;
        created_at: string;
        supplier_status: string | null;
      };
      return {
        status: 200,
        json: {
          idempotent: true,
          order: {
            id: e.id,
            reference: e.reference,
            status: e.status,
            supplier_status: e.supplier_status,
            total: Number(e.total_amount),
            item_count: e.item_count,
            created_at: e.created_at,
          },
        },
        responseSummary: { reference: e.reference, idempotent: true },
      };
    }
  }

  const order = await createWholesaleOrder({
    vendorId: ctx.vendorId,
    source: "bulk",
    items: resolved.map((r) => ({
      wholesaleBundleId: r.bundleId,
      recipientPhone: r.phone,
      unitPrice: r.unitPrice,
      quantity: r.quantity,
    })),
  });

  let orderReference = order.reference;
  if (input.reference) {
    const { error: refErr } = await service
      .from("wholesale_orders")
      .update({ reference: input.reference })
      .eq("id", order.id);
    if (!refErr) orderReference = input.reference;
  }

  const debited = await debitVendorWallet(
    ctx.vendorId,
    total,
    orderReference,
    `API bulk order ${orderReference} (${resolved.length} items)`,
  );

  if (!debited) {
    await service.from("wholesale_orders").delete().eq("id", order.id);
    return { status: 409, json: { error: "Wallet debit failed", code: "debit_failed" } };
  }

  await markWholesaleOrderPaid(orderReference, "api");
  await service
    .from("wholesale_orders")
    .update({ payment_provider: "wallet" })
    .eq("id", order.id);

  const updatedWallet = await getOrCreateVendorWallet(ctx.vendorId);

  return {
    status: 202,
    json: {
      order: {
        id: order.id,
        reference: orderReference,
        status: "queued",
        item_count: resolved.reduce((s, r) => s + r.quantity, 0),
        line_count: resolved.length,
        total,
        wallet_balance_after: updatedWallet.balance,
        invalid_lines: errors,
      },
    },
    responseSummary: { reference: orderReference, total, lines: resolved.length },
  };
});

export function OPTIONS() {
  return corsPreflightResponse();
}
