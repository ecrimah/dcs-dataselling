import { redirect } from "next/navigation";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { fetchVendorApiKeys } from "@/lib/vendor/extras";
import { DeveloperClient } from "./developer-client";

export const dynamic = "force-dynamic";

export default async function DeveloperPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  const keys = await fetchVendorApiKeys(vendor.id);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Developer API</h2>
        <p className="text-sm text-white/55">Integrate ordering into your bot or app.</p>
      </div>
      <DeveloperClient initialKeys={keys} />
    </div>
  );
}
