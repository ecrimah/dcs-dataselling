import { z } from "zod";

import { fetchWholesaleCatalogue } from "@/lib/data/wholesale";
import { resolveAgentBuyPrice } from "@/lib/wholesale/tier-pricing";
import { debitVendorWallet, getOrCreateVendorWallet } from "@/lib/payments/wallet";
import {
  createWholesaleOrder,
  markWholesaleOrderPaid,
} from "@/lib/payments/wholesale-order";
import { createServiceClient } from "@/lib/supabase/server";

import { corsPreflightResponse, handleApi, normalizeGhanaPhone } from "../_lib/respond";

export const dynamic = "force-dynamic";

const orderSchema = z
  .object({
    sku: z.string().optional(),
    bundle_id: z.string().uuid().optional(),
    recipient_phone: z.string().min(9).max(20),
    quantity: z.number().int().min(1).max(100).optional(),
    reference: z.string().max(80).optional(),
  })
  .refine((d) => Boolean(d.sku) || Boolean(d.bundle_id), {
    message: "Provide either 'sku' or 'bundle_id'",
  });

/**
 * POST /api/v1/orders
 * Place a single wholesale data order. Debits the vendor wallet and dispatches
 * to the supplier matching the bundle's network. Idempotent on `reference`
 * (if you pass one, retries with the same reference return the original order).
 */
export const POST = handleApi(async ({ ctx, body }) => {
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      json: { error: "Invalid request", code: "invalid_body", issues: parsed.error.issues },
    };
  }
  const input = parsed.data;

  const phone = normalizeGhanaPhone(input.recipient_phone);
  if (!phone) {
    return {
      status: 400,
      json: { error: "Invalid Ghana phone number", code: "invalid_phone" },
    };
  }

  const catalogue = await fetchWholesaleCatalogue(true);
  const bundle = input.bundle_id
    ? catalogue.find((b) => b.id === input.bundle_id)
    : catalogue.find((b) => b.sku.toLowerCase() === input.sku!.toLowerCase());

  if (!bundle) {
    return {
      status: 404,
      json: { error: "Bundle not found or inactive", code: "bundle_not_found" },
    };
  }

  const quantity = input.quantity ?? 1;
  const service = createServiceClient();

  // Idempotency: if caller passed `reference`, check if we already have an
  // order for this vendor + reference.
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

  const unitPrice = resolveAgentBuyPrice(bundle, ctx.vendorTier);
  const total = +(unitPrice * quantity).toFixed(2);
  const wallet = await getOrCreateVendorWallet(ctx.vendorId);
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

  const order = await createWholesaleOrder({
    vendorId: ctx.vendorId,
    source: "single",
    items: [
      {
        wholesaleBundleId: bundle.id,
        recipientPhone: phone,
        unitPrice,
        quantity,
      },
    ],
  });

  // Allow caller to override the auto-generated reference for idempotency.
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
    `API order ${orderReference} → ${phone}`,
  );

  if (!debited) {
    await service.from("wholesale_orders").delete().eq("id", order.id);
    return {
      status: 409,
      json: { error: "Wallet debit failed", code: "debit_failed" },
    };
  }

  await markWholesaleOrderPaid(orderReference, "api");
  await service
    .from("wholesale_orders")
    .update({ payment_provider: "wallet" })
    .eq("id", order.id);

  const updatedWallet = await getOrCreateVendorWallet(ctx.vendorId);

  return {
    status: 202, // Accepted; supplier dispatch happens async
    json: {
      order: {
        id: order.id,
        reference: orderReference,
        status: "queued",
        bundle: {
          id: bundle.id,
          sku: bundle.sku,
          name: bundle.name,
          network: bundle.network,
          data_mb: bundle.dataMb,
        },
        recipient_phone: phone,
        quantity,
        unit_price: unitPrice,
        total,
        wallet_balance_after: updatedWallet.balance,
      },
    },
    responseSummary: { reference: orderReference, total },
  };
});

const LIST_PAGE_MAX = 100;

/**
 * GET /api/v1/orders?limit=50&status=queued
 * List recent orders for this vendor (newest first).
 */
export const GET = handleApi(async ({ ctx, url }) => {
  const limitParam = Number(url.searchParams.get("limit") ?? "25");
  const limit = Math.max(1, Math.min(LIST_PAGE_MAX, Number.isFinite(limitParam) ? limitParam : 25));
  const statusFilter = url.searchParams.get("status")?.trim();

  const service = createServiceClient();
  let query = service
    .from("wholesale_orders")
    .select(
      `
      id, reference, status, total_amount, item_count, source, created_at, paid_at, fulfilled_at,
      supplier, supplier_status, supplier_error
    `,
    )
    .eq("vendor_id", ctx.vendorId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data, error } = await query;

  if (error) {
    return {
      status: 500,
      json: { error: "Could not list orders", code: "query_failed" },
    };
  }

  type Row = {
    id: string;
    reference: string;
    status: string;
    total_amount: number;
    item_count: number;
    source: string;
    created_at: string;
    paid_at: string | null;
    fulfilled_at: string | null;
    supplier: string | null;
    supplier_status: string | null;
    supplier_error: string | null;
  };

  return {
    json: {
      orders: ((data ?? []) as Row[]).map((o) => ({
        id: o.id,
        reference: o.reference,
        status: o.status,
        supplier_status: o.supplier_status,
        supplier_error: o.supplier_error,
        supplier: o.supplier,
        source: o.source,
        item_count: o.item_count,
        total: Number(o.total_amount),
        created_at: o.created_at,
        paid_at: o.paid_at,
        fulfilled_at: o.fulfilled_at,
      })),
      count: data?.length ?? 0,
    },
    responseSummary: { count: data?.length ?? 0 },
  };
});

export function OPTIONS() {
  return corsPreflightResponse();
}
