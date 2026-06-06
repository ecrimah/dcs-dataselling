import { redirect } from "next/navigation";
import { Smartphone } from "lucide-react";
import { AdminPageRoot, AdminSection } from "@/components/admin";
import { AgentWalletView } from "@/components/vendor/agent-wallet-view";
import { MomoClaimItPanel } from "@/components/vendor/momo-claimit-panel";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { getMomoDirectConfig } from "@/lib/data/platform-config";
import { fetchVendorWalletLedger, fetchVendorWalletMetrics } from "@/lib/data/vendor-agent";
import { primaryMerchantNumber } from "@/lib/payments/wallet-momo-claim";

export const dynamic = "force-dynamic";

export default async function VendorWalletPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  const [metrics, ledger, momo] = await Promise.all([
    fetchVendorWalletMetrics(vendor.id),
    fetchVendorWalletLedger(vendor.id),
    getMomoDirectConfig(),
  ]);

  return (
    <AdminPageRoot className="space-y-4">
      <AdminSection
        title="MoMo ClaimIt"
        description="Top up your wallet — generate a payment code or claim with your transaction ID."
        icon={Smartphone}
      >
        <MomoClaimItPanel
          config={{
            enabled: momo.enabled,
            merchantNumber: primaryMerchantNumber(momo.merchantNumbers),
            merchantName: momo.merchantName || "DCS Elite",
            merchantNumbers: momo.merchantNumbers,
          }}
          showCancel={false}
        />
      </AdminSection>
      <AgentWalletView metrics={metrics} ledger={ledger} embedded />
    </AdminPageRoot>
  );
}
