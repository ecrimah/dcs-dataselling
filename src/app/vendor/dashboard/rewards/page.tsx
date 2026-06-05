import { redirect } from "next/navigation";
import { AdminPageIntro, AdminPageRoot } from "@/components/admin";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { getAgentTierSettings } from "@/lib/data/tier-settings";
import { ensureVendorReferralCode } from "@/lib/referrals/vendor-referral";
import { fetchVendorRewards } from "@/lib/vendor/extras";
import { getTierConfigFromSettings } from "@/lib/vendor/tiers";
import { RewardsClient } from "./rewards-client";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  const [referralCode, { balance, withdrawals }] = await Promise.all([
    ensureVendorReferralCode(vendor.id),
    fetchVendorRewards(vendor.id),
  ]);
  const tierSettings = await getAgentTierSettings();
  const tierConfig = getTierConfigFromSettings(vendor.tier, tierSettings);

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="Agent rewards"
        description="Earn from referrals and customer sales markup. Withdraw to MoMo when ready."
        meta={`${withdrawals.length} withdrawal requests`}
      />
      <RewardsClient
        initialBalance={balance}
        referralCode={referralCode || vendor.referralCode || "—"}
        withdrawals={withdrawals}
        minWithdrawal={tierConfig.minWithdrawal}
      />
    </AdminPageRoot>
  );
}
