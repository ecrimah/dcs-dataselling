import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  code: z.string().trim().max(40).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  discountPercent: z.number().min(0).max(100).nullable().optional(),
  discountAmount: z.number().min(0).nullable().optional(),
  active: z.boolean().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
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

  const updates: Record<string, unknown> = {};
  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  if (body.title !== undefined) updates.title = body.title;
  if (body.code !== undefined) {
    updates.code = body.code?.trim() ? body.code.trim().toUpperCase() : null;
  }
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.discountPercent !== undefined) updates.discount_percent = body.discountPercent;
  if (body.discountAmount !== undefined) updates.discount_amount = body.discountAmount;
  if (body.active !== undefined) updates.active = body.active;
  if (body.startsAt !== undefined) updates.starts_at = body.startsAt;
  if (body.endsAt !== undefined) updates.ends_at = body.endsAt;

  const service = createServiceClient();
  const { error } = await service.from("promotions").update(updates).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
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
  const service = createServiceClient();
  const { error } = await service.from("promotions").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
