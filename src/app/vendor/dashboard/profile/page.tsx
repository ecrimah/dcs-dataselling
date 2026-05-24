import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, User } from "lucide-react";
import {
  AdminKvList,
  AdminKvRow,
  AdminPageIntro,
  AdminPageRoot,
  AdminSection,
} from "@/components/admin";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentProfile, getCurrentVendor } from "@/lib/auth/session";
import { getAgentTierSettings } from "@/lib/data/tier-settings";
import { SITE } from "@/lib/constants";
import { formatGHS } from "@/lib/format";
import { getOrCreateVendorWallet } from "@/lib/payments/wallet";
import { getTierConfigFromSettings, getTierLabel } from "@/lib/vendor/tiers";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  const profile = await getCurrentProfile();
  const wallet = await getOrCreateVendorWallet(vendor.id);
  const tierSettings = await getAgentTierSettings();
  const tierConfig = getTierConfigFromSettings(vendor.tier, tierSettings);
  const tierLabel = getTierLabel(vendor.tier, tierSettings);
  const displayName = profile?.fullName ?? vendor.businessName;
  const superRules = tierSettings.promotion.verified;
  const proRules = tierSettings.promotion.pro;

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge={tierLabel}
        description="Your agent profile, role benefits, and account shortcuts."
        meta={`/${vendor.slug} · ${formatGHS(wallet.balance)} wallet`}
      />

      <AdminSection title="Agent role" description="Higher roles unlock lower platform fees and better rewards." icon={Award}>
        <AdminKvList>
          <AdminKvRow label="Current role" value={tierConfig.label} />
          <AdminKvRow label="Platform fee" value={`${tierConfig.commissionRate}%`} />
          <AdminKvRow
            label="Reward rate"
            value={`${Math.round(tierConfig.rewardRate * 100)}% of markup on fulfilled orders`}
          />
          <AdminKvRow label="Min withdrawal" value={formatGHS(tierConfig.minWithdrawal)} />
        </AdminKvList>
        {vendor.tier !== "pro" && (
          <p className="mt-3 text-xs text-muted">
            {vendor.tier === "starter"
              ? `Reach Super Agent: ${superRules.minFulfilledOrders}+ fulfilled orders at ${superRules.minSuccessRate}%+ success, or ${superRules.minDailyOrders}+ orders in a day.`
              : `Reach Pro Agent: ${proRules.minFulfilledOrders}+ fulfilled orders at ${proRules.minSuccessRate}%+ success, or ${proRules.minDailyOrders}+ orders in a day.`}
          </p>
        )}
      </AdminSection>

      <AdminSection title="Profile" description="Account identity and contact." icon={User}>
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-400 text-lg font-bold text-amber-950">
            {displayName.slice(0, 1)}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{displayName}</p>
            <p className="text-xs text-muted">{profile?.email}</p>
          </div>
        </div>
        <AdminKvList className="mt-3">
          <AdminKvRow label="Store" value={vendor.businessName} />
          <AdminKvRow label="Slug" value={<span className="font-mono text-amber-800">/{vendor.slug}</span>} />
          <AdminKvRow label="Wallet" value={formatGHS(wallet.balance)} />
          <AdminKvRow label="WhatsApp" value={vendor.whatsappNumber ?? "—"} />
        </AdminKvList>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/vendor/dashboard/storefront" className="susu-btn-gold">
            Storefront
          </Link>
          <Link
            href={`https://wa.me/${SITE.supportWhatsApp.replace(/\D/g, "")}`}
            className="susu-btn-ghost"
          >
            Support
          </Link>
        </div>
      </AdminSection>
    </AdminPageRoot>
  );
}
