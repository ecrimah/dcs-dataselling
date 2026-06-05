import { NextResponse } from "next/server";
import { z } from "zod";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(20).optional(),
  whatsapp: z.string().trim().max(20).optional(),
});

export async function PATCH(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.fullName && body.phone === undefined && body.whatsapp === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const service = createServiceClient();

  if (body.fullName !== undefined || body.phone !== undefined) {
    const profileUpdates: Record<string, string | null> = {};
    if (body.fullName !== undefined) profileUpdates.full_name = body.fullName;
    if (body.phone !== undefined) profileUpdates.phone = body.phone || null;

    const { error } = await service.from("profiles").update(profileUpdates).eq("id", ctx.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (body.whatsapp !== undefined) {
    const { error } = await service
      .from("vendors")
      .update({ whatsapp_number: body.whatsapp || null })
      .eq("id", ctx.vendorId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
