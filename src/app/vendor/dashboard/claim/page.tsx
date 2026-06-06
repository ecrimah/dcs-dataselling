import { redirect } from "next/navigation";
import { Smartphone } from "lucide-react";
import { AdminPageIntro, AdminPageRoot, AdminSection } from "@/components/admin";
import { MomoClaimItPanel } from "@/components/vendor/momo-claimit-panel";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { getMomoDirectConfig } from "@/lib/data/platform-config";
import { primaryMerchantNumber } from "@/lib/payments/wallet-momo-claim";

export const dynamic = "force-dynamic";

export default async function ClaimItPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  const momo = await getMomoDirectConfig();

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="ClaimIt"
        description="Send Mobile Money to credit your wallet — generate a payment code for instant top-up, or paste your transaction ID to claim manually."
      />
      <AdminSection
        title="Mobile Money ClaimIt"
        description="Use the merchant number below. Add your payment code as the MoMo reference for automatic wallet credit."
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
    </AdminPageRoot>
  );
}
