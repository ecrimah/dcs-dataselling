import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z
  .object({
    title: z.string().trim().min(2).max(120),
    code: z.string().trim().max(40).optional().nullable(),
    description: z.string().trim().max(500).optional().nullable(),
    discountPercent: z.number().min(0).max(100).nullable().optional(),
    discountAmount: z.number().min(0).nullable().optional(),
    active: z.boolean().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    endsAt: z.string().datetime().nullable().optional(),
  })
  .refine(
    (data) => data.discountPercent != null || data.discountAmount != null,
    { message: "Set a percent or fixed discount amount" },
  );

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

  const code = body.code?.trim() ? body.code.trim().toUpperCase() : null;
  const service = createServiceClient();

  const { data, error } = await service
    .from("promotions")
    .insert({
      title: body.title,
      code,
      description: body.description?.trim() || null,
      discount_percent: body.discountPercent ?? null,
      discount_amount: body.discountAmount ?? null,
      active: body.active ?? true,
      starts_at: body.startsAt ?? null,
      ends_at: body.endsAt ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: (data as { id: string }).id });
}
