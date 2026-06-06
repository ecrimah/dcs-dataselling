import { redirect } from "next/navigation";
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
        description="Top up your wallet via Mobile Money — generate a payment code or claim manually with your transaction ID."
      />
      <AdminSection
        title="Mobile Money ClaimIt"
        description="Send MoMo to the merchant number with your payment code, or paste your transaction ID if auto-match did not run."
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
