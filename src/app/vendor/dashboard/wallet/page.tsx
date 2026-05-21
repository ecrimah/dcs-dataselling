import { redirect } from "next/navigation";
import { AgentWalletView } from "@/components/vendor/agent-wallet-view";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { fetchVendorWalletLedger, fetchVendorWalletMetrics } from "@/lib/data/vendor-agent";

export const dynamic = "force-dynamic";

export default async function VendorWalletPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  const [metrics, ledger] = await Promise.all([
    fetchVendorWalletMetrics(vendor.id),
    fetchVendorWalletLedger(vendor.id),
  ]);

  return <AgentWalletView metrics={metrics} ledger={ledger} />;
}
