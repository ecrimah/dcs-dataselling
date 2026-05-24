import { redirect } from "next/navigation";
import { AdminPageIntro, AdminPageRoot } from "@/components/admin";
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
    <AdminPageRoot>
      <AdminPageIntro
        badge="Agent rewards"
        description="Earn from referrals and customer sales markup. Withdraw to MoMo when ready."
        meta={`${withdrawals.length} withdrawal requests`}
      />
      <RewardsClient
        initialBalance={balance}
        referralCode={vendor.referralCode ?? "—"}
        withdrawals={withdrawals}
      />
    </AdminPageRoot>
  );
}
