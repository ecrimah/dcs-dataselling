import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { creditVendorReward } from "@/lib/vendor/extras";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  status: z.enum([
    "pending",
    "paid",
    "queued",
    "processing",
    "fulfilled",
    "failed",
    "refunded",
  ]),
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

  const updates: Record<string, unknown> = {
    status: body.status,
    updated_at: new Date().toISOString(),
  };
  if (body.status === "fulfilled") {
    updates.fulfilled_at = new Date().toISOString();
  }

  const service = createServiceClient();

  const { data: existing } = await service
    .from("orders")
    .select("id, vendor_id, status, amount, platform_fee, reference")
    .eq("id", id)
    .maybeSingle();

  const { error } = await service.from("orders").update(updates).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const prev = existing as {
    vendor_id: string;
    status: string;
    amount: number;
    platform_fee: number;
    reference: string;
  } | null;

  if (body.status === "fulfilled" && prev && prev.status !== "fulfilled") {
    const markupEstimate = Math.max(0, Number(prev.amount) - Number(prev.platform_fee)) * 0.15;
    if (markupEstimate > 0) {
      await creditVendorReward(prev.vendor_id, +markupEstimate.toFixed(2), prev.reference);
    }
  }

  return NextResponse.json({ ok: true });
}
