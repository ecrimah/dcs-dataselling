import { redirect } from "next/navigation";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { fetchVendorRewards } from "@/lib/vendor/extras";
import { RewardsClient } from "./rewards-client";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  const { balance, withdrawals } = await fetchVendorRewards(vendor.id);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Rewards</h2>
        <p className="text-sm text-muted">Earn from referrals and customer sales markup.</p>
      </div>
      <RewardsClient
        initialBalance={balance}
        referralCode={vendor.referralCode ?? "—"}
        withdrawals={withdrawals}
      />
    </div>
  );
}
