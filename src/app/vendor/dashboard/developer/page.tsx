import { redirect } from "next/navigation";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DeveloperPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h2 className="text-xl font-bold text-white">Developer API</h2>
      <p className="text-sm text-white/55">
        Integrate DCS ordering into your own app or bot. API access is enabled per agent on request.
      </p>
      <div className="rounded-2xl border border-white/10 bg-navy-900 p-4 font-mono text-xs text-white/70">
        <p className="text-white/40"># Coming soon</p>
        <p className="mt-2">POST /api/vendor/wholesale/orders</p>
        <p>POST /api/vendor/wholesale/orders/bulk</p>
        <p>GET /api/vendor/wallet</p>
      </div>
      <p className="text-[11px] text-white/35">
        Contact DCS support to enable API keys and webhook URLs for your vendor ID{" "}
        <span className="font-mono text-gold">{vendor.id.slice(0, 8)}…</span>
      </p>
    </div>
  );
}
