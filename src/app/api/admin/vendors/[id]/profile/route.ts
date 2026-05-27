import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  fullName: z.string().min(2).max(80).optional(),
  phone: z.string().min(9).max(20).optional(),
  businessName: z.string().min(2).max(120).optional(),
  momoNumber: z.string().max(20).nullable().optional(),
  whatsappNumber: z.string().max(20).nullable().optional(),
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
    return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
  }

  if (
    body.fullName === undefined &&
    body.phone === undefined &&
    body.businessName === undefined &&
    body.momoNumber === undefined &&
    body.whatsappNumber === undefined
  ) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: vendor } = await service
    .from("vendors")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  const v = vendor as { user_id: string } | null;
  if (!v) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const vendorUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.businessName !== undefined) vendorUpdates.business_name = body.businessName.trim();
  if (body.momoNumber !== undefined) vendorUpdates.momo_number = body.momoNumber?.trim() || null;
  if (body.whatsappNumber !== undefined) {
    vendorUpdates.whatsapp_number = body.whatsappNumber?.trim() || null;
  }

  const profileUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.fullName !== undefined) profileUpdates.full_name = body.fullName.trim();
  if (body.phone !== undefined) profileUpdates.phone = body.phone.trim();

  const { error: vendorErr } = await service.from("vendors").update(vendorUpdates).eq("id", id);
  if (vendorErr) {
    return NextResponse.json({ error: vendorErr.message }, { status: 400 });
  }

  if (Object.keys(profileUpdates).length > 1) {
    const { error: profileErr } = await service
      .from("profiles")
      .update(profileUpdates)
      .eq("id", v.user_id);
    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}
