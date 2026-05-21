import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  code: z.string().min(3).max(40),
  amount: z.number().positive(),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  active: z.boolean().optional(),
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

  const code = body.code.trim().toUpperCase();
  const service = createServiceClient();
  const { data, error } = await service
    .from("promo_codes")
    .insert({
      code,
      amount: body.amount,
      max_redemptions: body.maxRedemptions ?? null,
      expires_at: body.expiresAt ?? null,
      active: body.active ?? true,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: (data as { id: string }).id });
}
