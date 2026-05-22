import { NextResponse } from "next/server";
import { z } from "zod";

import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import {
  fetchVendorWebhook,
  saveVendorWebhook,
} from "@/lib/vendor/developer";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ url: null, enabled: false, has_secret: false });
  }
  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;
  const webhook = await fetchVendorWebhook(ctx.vendorId);
  return NextResponse.json(webhook);
}

const saveSchema = z.object({
  url: z.string().url().nullable().optional(),
  enabled: z.boolean().optional(),
  rotate_secret: z.boolean().optional(),
});

export async function PUT(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  try {
    const body = saveSchema.parse(await request.json());
    const saved = await saveVendorWebhook(ctx.vendorId, {
      url: body.url ?? null,
      enabled: body.enabled,
      rotateSecret: body.rotate_secret,
    });
    return NextResponse.json({
      url: saved.url,
      enabled: saved.enabled,
      // New secret (only present when freshly minted / rotated)
      secret: saved.secret ?? null,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not save webhook" },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  await saveVendorWebhook(ctx.vendorId, { url: null, enabled: false });
  return NextResponse.json({ ok: true });
}
