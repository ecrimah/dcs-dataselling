import { NextResponse } from "next/server";
import { z } from "zod";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

/** Normalize a Ghana phone to local 0XXXXXXXXX form, or null if invalid. */
function normalizeGhanaPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return digits;
  if (digits.length === 12 && digits.startsWith("233")) return `0${digits.slice(3)}`;
  if (digits.length === 9) return `0${digits}`;
  return null;
}

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

  // Phone is required for SMS alerts: if it's part of this update, it must be
  // a valid Ghana number (can't be cleared to empty).
  let normalizedPhone: string | undefined;
  if (body.phone !== undefined) {
    normalizedPhone = normalizeGhanaPhone(body.phone) ?? undefined;
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "A valid Ghana phone number is required for SMS alerts." },
        { status: 400 },
      );
    }
  }

  if (body.fullName !== undefined || normalizedPhone !== undefined) {
    const profileUpdates: Record<string, string | null> = {};
    if (body.fullName !== undefined) profileUpdates.full_name = body.fullName;
    if (normalizedPhone !== undefined) profileUpdates.phone = normalizedPhone;

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
