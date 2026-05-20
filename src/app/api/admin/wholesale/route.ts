import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  network: z.enum(["mtn", "telecel", "at"]),
  name: z.string().min(2),
  dataMb: z.number().int().positive(),
  validityDays: z.number().int().positive(),
  wholesalePrice: z.number().positive(),
  suggestedRetail: z.number().positive(),
  minMarkup: z.number().min(0).default(0.5),
  maxMarkup: z.number().positive().nullable().optional(),
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
      wholesale_price: body.wholesalePrice,
      suggested_retail: body.suggestedRetail,
      min_markup: body.minMarkup,
      max_markup: body.maxMarkup ?? null,
      active: true,
      popular: false,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
