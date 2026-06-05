import { redirect } from "next/navigation";
import { AgentProfileView } from "@/components/vendor/agent-profile-view";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentProfile, getCurrentVendor } from "@/lib/auth/session";
import {
  fetchVendorProfilePhone,
  fetchVendorWalletPeriodTopups,
  splitDisplayName,
} from "@/lib/data/vendor-profile";
import { getAgentTierSettings } from "@/lib/data/tier-settings";
import { formatGHS } from "@/lib/format";
import { getTierConfigFromSettings, getTierLabel } from "@/lib/vendor/tiers";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  const profile = await getCurrentProfile();
  const [phone, walletStats, tierSettings] = await Promise.all([
    profile ? fetchVendorProfilePhone(profile.id) : Promise.resolve(null),
    fetchVendorWalletPeriodTopups(vendor.id),
    getAgentTierSettings(),
  ]);

  const tierConfig = getTierConfigFromSettings(vendor.tier, tierSettings);
  const tierLabel = getTierLabel(vendor.tier, tierSettings);
  const displayName = profile?.fullName?.trim() || vendor.businessName;
  const { firstName, lastName } = splitDisplayName(displayName);
  const superRules = tierSettings.promotion.verified;
  const proRules = tierSettings.promotion.pro;

  const tierHint =
    vendor.tier === "pro"
      ? null
      : vendor.tier === "starter"
        ? `Reach Super Agent: ${superRules.minFulfilledOrders}+ fulfilled orders at ${superRules.minSuccessRate}%+ success, or ${superRules.minDailyOrders}+ orders in a day.`
        : `Reach Pro Agent: ${proRules.minFulfilledOrders}+ fulfilled orders at ${proRules.minSuccessRate}%+ success, or ${proRules.minDailyOrders}+ orders in a day.`;

  const isActive = vendor.status === "approved";

  return (
    <AgentProfileView
      fullName={displayName}
      firstName={firstName}
      lastName={lastName}
      avatarUrl={profile?.avatarUrl ?? null}
      email={profile?.email ?? "—"}
      phone={phone ?? vendor.momoNumber ?? null}
      whatsapp={vendor.whatsappNumber ?? null}
      businessName={vendor.businessName}
      slug={vendor.slug}
      tierLabel={tierLabel}
      statusLabel={isActive ? "ACTIVE" : vendor.status.toUpperCase()}
      isActive={isActive}
      walletBalance={walletStats.balance}
      topupsThisMonth={walletStats.topupsThisMonth}
      topupsThisYear={walletStats.topupsThisYear}
      commissionRate={`${tierConfig.commissionRate}%`}
      rewardRate={`${Math.round(tierConfig.rewardRate * 100)}% of markup`}
      minWithdrawal={formatGHS(tierConfig.minWithdrawal)}
      tierHint={tierHint}
    />
  );
}
