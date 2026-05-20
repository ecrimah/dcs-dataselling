import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  wholesalePrice: z.number().positive().optional(),
  suggestedRetail: z.number().positive().optional(),
  minMarkup: z.number().min(0).optional(),
  maxMarkup: z.number().positive().nullable().optional(),
  active: z.boolean().optional(),
  popular: z.boolean().optional(),
  name: z.string().min(2).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const auth = await assertAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.wholesalePrice !== undefined) updates.wholesale_price = body.wholesalePrice;
  if (body.suggestedRetail !== undefined) updates.suggested_retail = body.suggestedRetail;
  if (body.minMarkup !== undefined) updates.min_markup = body.minMarkup;
  if (body.maxMarkup !== undefined) updates.max_markup = body.maxMarkup;
  if (body.active !== undefined) updates.active = body.active;
  if (body.popular !== undefined) updates.popular = body.popular;
  if (body.name !== undefined) updates.name = body.name;

  const service = createServiceClient();
  const { error } = await service.from("wholesale_bundles").update(updates).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
