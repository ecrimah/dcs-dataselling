import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { legacyPriceSync, normalizeWholesalePrices } from "@/lib/wholesale/tier-pricing";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const priceSchema = z.object({
  costPrice: z.number().min(0),
  customerPrice: z.number().min(0),
  customerProPrice: z.number().min(0),
  agentPrice: z.number().min(0),
  agentProPrice: z.number().min(0),
  xpressAgentPrice: z.number().min(0),
});

const schema = z.object({
  network: z.enum(["mtn", "telecel", "at"]),
  name: z.string().min(2),
  dataMb: z.number().int().positive(),
  validityDays: z.number().int().positive(),
  minMarkup: z.number().min(0).default(0.5),
  maxMarkup: z.number().positive().nullable().optional(),
  productLine: z.enum(["standard", "ishare", "bigtime"]).nullable().optional(),
  prices: priceSchema.optional(),
  wholesalePrice: z.number().positive().optional(),
  suggestedRetail: z.number().positive().optional(),
});

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
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

  const prices = normalizeWholesalePrices(
    body.prices ?? {
      agentPrice: body.wholesalePrice,
      customerPrice: body.suggestedRetail,
    },
  );
  const legacy = legacyPriceSync(prices);

  const sku = `${body.network.toUpperCase().slice(0, 3)}-${body.dataMb}MB-${body.validityDays}D`;

  const service = createServiceClient();
  const { data, error } = await service
    .from("wholesale_bundles")
    .insert({
      network: body.network,
      sku,
      name: body.name,
      data_mb: body.dataMb,
      validity_days: body.validityDays,
      cost_price: prices.costPrice,
      customer_price: prices.customerPrice,
      customer_pro_price: prices.customerProPrice,
      agent_price: prices.agentPrice,
      agent_pro_price: prices.agentProPrice,
      xpress_agent_price: prices.xpressAgentPrice,
      wholesale_price: legacy.wholesale_price,
      suggested_retail: legacy.suggested_retail,
      min_markup: body.minMarkup,
      max_markup: body.maxMarkup ?? null,
      active: true,
      popular: false,
      product_line: body.productLine ?? "standard",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
