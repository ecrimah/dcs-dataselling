import { redirect } from "next/navigation";
import { Tag } from "lucide-react";
import { AdminPageIntro, AdminPageRoot, AdminSection } from "@/components/admin";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { ClaimItForm } from "./claim-form";

export const dynamic = "force-dynamic";

export default async function ClaimItPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="ClaimIt"
        description="Enter a promo or reward code from DCS to credit your wallet instantly."
      />
      <AdminSection title="Redeem code" description="One-time codes credit your wallet on success." icon={Tag}>
        <ClaimItForm />
      </AdminSection>
    </AdminPageRoot>
  );
}
