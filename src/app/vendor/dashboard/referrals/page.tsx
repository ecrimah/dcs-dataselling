import { redirect } from "next/navigation";
import { ReferralsClient } from "@/components/vendor/referrals-client";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { fetchVendorReferralStats } from "@/lib/referrals/vendor-referral";

export const dynamic = "force-dynamic";

export default async function VendorReferralsPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  const stats = await fetchVendorReferralStats(vendor.id);

  return <ReferralsClient stats={stats} />;
}
