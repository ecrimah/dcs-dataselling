import { redirect } from "next/navigation";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { WholesaleTerminal } from "@/components/vendor/wholesale-terminal";
import { getCurrentVendor } from "@/lib/auth/session";
import type { NetworkId } from "@/lib/constants";
import { fetchWholesaleCatalogue } from "@/lib/data/wholesale";
import { getOrCreateVendorWallet } from "@/lib/payments/wallet";

export const dynamic = "force-dynamic";

export default async function WholesaleBuyPage({
  searchParams,
}: {
  searchParams: Promise<{
    topup?: string;
    ref?: string;
    network?: string;
    line?: string;
    mode?: string;
    cart?: string;
  }>;
}) {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");

  if (!vendor.setupFeePaidAt) {
    return <SetupFeeGate />;
  }

  const sp = await searchParams;
  const [wholesale, wallet] = await Promise.all([
    fetchWholesaleCatalogue(),
    getOrCreateVendorWallet(vendor.id),
  ]);

  const networkParam = sp.network as NetworkId | undefined;
  const initialNetwork =
    networkParam && ["mtn", "telecel", "at"].includes(networkParam) ? networkParam : "all";
  const initialLine =
    sp.line === "ishare" || sp.line === "bigtime" ? sp.line : undefined;
  const initialMode = sp.mode === "bulk" ? "bulk" : "shop";

  return (
    <WholesaleTerminal
      wholesale={wholesale}
      initialBalance={wallet.balance}
      topupCallback={sp.ref ? sp.ref : undefined}
      initialNetwork={initialNetwork}
      initialLine={initialLine}
      initialMode={initialMode}
      openTopupOnMount={sp.topup === "1" && !sp.ref}
      openCartOnMount={sp.cart === "1"}
    />
  );
}
