import { NextResponse } from "next/server";
import { z } from "zod";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const bodySchema = z.object({
  bundleId: z.string().uuid(),
});

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ids: [] });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  const service = createServiceClient();
  const { data } = await service
    .from("vendor_wishlist_items")
    .select("wholesale_bundle_id")
    .eq("vendor_id", ctx.vendorId);

  const ids = ((data ?? []) as { wholesale_bundle_id: string }[]).map(
    (r) => r.wholesale_bundle_id,
  );
  return NextResponse.json({ ids });
}

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid bundle id" }, { status: 400 });
  }

  const service = createServiceClient();
  const { error } = await service.from("vendor_wishlist_items").upsert(
    {
      vendor_id: ctx.vendorId,
      wholesale_bundle_id: body.bundleId,
    },
    { onConflict: "vendor_id,wholesale_bundle_id", ignoreDuplicates: true },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  const bundleId = new URL(request.url).searchParams.get("bundleId");
  const parsed = z.string().uuid().safeParse(bundleId);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid bundle id" }, { status: 400 });
  }

  const service = createServiceClient();
  const { error } = await service
    .from("vendor_wishlist_items")
    .delete()
    .eq("vendor_id", ctx.vendorId)
    .eq("wholesale_bundle_id", parsed.data);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
