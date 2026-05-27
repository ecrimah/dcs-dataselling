import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { creditVendorReward } from "@/lib/vendor/extras";
import { getVendorTierForReward } from "@/lib/data/admin-tier-ops";
import { getAgentTierSettings } from "@/lib/data/tier-settings";
import { getTierConfigFromSettings } from "@/lib/vendor/tiers";
import { smsOrderFulfilled } from "@/lib/notifications/sms";
import { formatDataAmount } from "@/lib/format";
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
    .select(
      `
      id, vendor_id, status, amount, platform_fee, reference, recipient_phone, reward_credited_at,
      bundles ( name, data_mb )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  const { error } = await service.from("orders").update(updates).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const prev = existing as {
    id: string;
    vendor_id: string;
    status: string;
    amount: number;
    platform_fee: number;
    reference: string;
    recipient_phone: string;
    reward_credited_at: string | null;
    bundles: { name: string; data_mb: number } | { name: string; data_mb: number }[] | null;
  } | null;

  if (body.status === "fulfilled" && prev && prev.status !== "fulfilled") {
    // Only credit if we haven't already (handles overlap with supplier webhook).
    if (!prev.reward_credited_at) {
      const tier = await getVendorTierForReward(prev.vendor_id);
      const settings = await getAgentTierSettings();
      const rewardRate = getTierConfigFromSettings(tier, settings).rewardRate;
      const markupEstimate =
        Math.max(0, Number(prev.amount) - Number(prev.platform_fee)) * rewardRate;
      if (markupEstimate > 0) {
        await creditVendorReward(prev.vendor_id, +markupEstimate.toFixed(2), prev.reference);
        await service
          .from("orders")
          .update({ reward_credited_at: new Date().toISOString() })
          .eq("id", prev.id);
      }
    }

    const bundle = Array.isArray(prev.bundles) ? prev.bundles[0] : prev.bundles;
    const bundleLabel = bundle
      ? `${formatDataAmount(bundle.data_mb)} ${bundle.name}`
      : "Data bundle";
    void smsOrderFulfilled({
      phone: prev.recipient_phone,
      reference: prev.reference,
      bundleLabel,
    });
  }

  return NextResponse.json({ ok: true });
}
