import { redirect } from "next/navigation";
import { Eye, Share2, Store, Tags } from "lucide-react";
import Link from "next/link";
import {
  AdminPageIntro,
  AdminPageRoot,
  AdminSection,
} from "@/components/admin";
import { SITE } from "@/lib/constants";
import { getCurrentVendor } from "@/lib/auth/session";
import { StoreIcon } from "@/components/vendor/store-icon";
import { resolveThemeBackground } from "@/lib/vendor-theme";
import { Button } from "@/components/ui/button";
import { ReferralShareCard } from "@/components/vendor/referral-share-card";
import { ShareKit } from "@/components/vendor/share-kit";
import { fetchVendorReferralStats, getReferralRewardAmount } from "@/lib/referrals/vendor-referral";

export const dynamic = "force-dynamic";

export default async function StorefrontPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");

  const storeUrl = `${SITE.url.replace(/\/$/, "")}/vendor/${vendor.slug}`;
  const referralStats = await fetchVendorReferralStats(vendor.id);
  const rewardAmount = await getReferralRewardAmount();

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="Your store"
        description="Customize how buyers see your store and share your link."
        meta={storeUrl.replace(/^https?:\/\//, "")}
        actions={
          <Button size="sm" variant="secondary" asChild>
            <Link href={`/vendor/${vendor.slug}`} target="_blank">
              <Eye className="h-4 w-4" />
              Preview
            </Link>
          </Button>
        }
      />

      <div
        className="overflow-hidden rounded-xl p-5 text-white shadow-md"
        style={{ background: resolveThemeBackground(vendor.themeColor) }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-sm">
            <StoreIcon icon={vendor.emoji} size={24} strokeWidth={1.75} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{vendor.businessName}</h3>
            <p className="text-xs text-white/80">{storeUrl.replace(/^https?:\/\//, "")}</p>
          </div>
        </div>
      </div>

      <AdminSection
        title="Your selling prices"
        description="Set markup on each bundle — that becomes the price customers see on your store."
        icon={Tags}
      >
        <Button size="sm" asChild>
          <Link href="/vendor/dashboard/catalogue">Set my prices</Link>
        </Button>
      </AdminSection>

      <AdminSection title="Share your store" description="Send your link to friends, customers, and groups." icon={Share2}>
        <ShareKit storeUrl={storeUrl} businessName={vendor.businessName} />
      </AdminSection>

      <AdminSection
        title="Refer & earn"
        description={`Invite friends to sell on DCS — earn ₵${rewardAmount.toFixed(0)} when they make their first sale.`}
        icon={Store}
      >
        <ReferralShareCard
          referralCode={referralStats.referralCode}
          inviteLink={referralStats.inviteLink}
          rewardAmount={rewardAmount}
        />
      </AdminSection>
    </AdminPageRoot>
  );
}
