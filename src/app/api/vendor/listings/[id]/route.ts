import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const patchSchema = z.object({
  markupAmount: z.number().min(0).max(500).optional(),
  active: z.boolean().optional(),
  customName: z.string().max(80).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  try {
    const body = patchSchema.parse(await request.json());
    const service = createServiceClient();

    const { data: vendor } = await service
      .from("vendors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    const v = vendor as { id: string } | null;
    if (!v) return NextResponse.json({ error: "No vendor" }, { status: 404 });

    const update: Record<string, unknown> = {};
    if (body.markupAmount !== undefined) update.markup_amount = body.markupAmount;
    if (body.active !== undefined) update.active = body.active;
    if (body.customName !== undefined) update.custom_name = body.customName;

    const { error } = await service
      .from("vendor_listings")
      .update(update)
      .eq("id", id)
      .eq("vendor_id", v.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const service = createServiceClient();
  const { data: vendor } = await service
    .from("vendors")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const v = vendor as { id: string } | null;
  if (!v) return NextResponse.json({ error: "No vendor" }, { status: 404 });

  await service.from("vendor_listings").delete().eq("id", id).eq("vendor_id", v.id);
  return NextResponse.json({ ok: true });
}
