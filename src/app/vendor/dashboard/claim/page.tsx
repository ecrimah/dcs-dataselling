import { redirect } from "next/navigation";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { ClaimItForm } from "./claim-form";

export const dynamic = "force-dynamic";

export default async function ClaimItPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h2 className="text-xl font-bold text-white">ClaimIt</h2>
      <p className="text-sm text-white/55">
        Enter a promo or reward code from DCS to credit your wallet instantly.
      </p>
      <ClaimItForm />
    </div>
  );
}
