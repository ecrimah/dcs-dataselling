import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { creditVendorReward } from "@/lib/vendor/extras";
import { getVendorTierForReward } from "@/lib/data/admin-tier-ops";
import { getAgentTierSettings } from "@/lib/data/tier-settings";
import { getTierConfigFromSettings } from "@/lib/vendor/tiers";
import { smsOrderFulfilled } from "@/lib/notifications/sms";
import { formatDataAmount } from "@/lib/format";
import { tryCreditReferralForCustomerOrder } from "@/lib/referrals/vendor-referral";
import type { OrderStatus } from "@/lib/constants";

export async function applyCustomerOrderStatus(
  service: SupabaseClient,
  orderId: string,
  status: OrderStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "fulfilled") {
    updates.fulfilled_at = new Date().toISOString();
  }

  const { data: existing } = await service
    .from("orders")
    .select(
      `
      id, vendor_id, status, amount, platform_fee, reference, recipient_phone, reward_credited_at,
      bundles ( name, data_mb )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  const { error } = await service.from("orders").update(updates).eq("id", orderId);
  if (error) return { ok: false, error: error.message };

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

  if (status === "fulfilled" && prev && prev.status !== "fulfilled") {
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

    void tryCreditReferralForCustomerOrder(prev.id);
  }

  return { ok: true };
}
