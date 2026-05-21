import { redirect } from "next/navigation";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { WholesaleTerminal } from "@/components/vendor/wholesale-terminal";
import { getCurrentVendor } from "@/lib/auth/session";
import { fetchWholesaleCatalogue } from "@/lib/data/wholesale";
import { getOrCreateVendorWallet } from "@/lib/payments/wallet";

export const dynamic = "force-dynamic";

export default async function WholesaleBuyPage({
  searchParams,
}: {
  searchParams: Promise<{ topup?: string; ref?: string }>;
}) {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");

  if (!vendor.setupFeePaidAt) {
    return <SetupFeeGate />;
  }

  const [wholesale, wallet, sp] = await Promise.all([
    fetchWholesaleCatalogue(),
    getOrCreateVendorWallet(vendor.id),
    searchParams,
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Buy Data</h2>
        <p className="mt-1 text-sm text-muted">
          Top up your wallet, pick products, and place orders instantly.
        </p>
      </div>
      <WholesaleTerminal
        wholesale={wholesale}
        initialBalance={wallet.balance}
        topupCallback={sp.topup === "1" ? sp.ref : undefined}
      />
    </div>
  );
}
