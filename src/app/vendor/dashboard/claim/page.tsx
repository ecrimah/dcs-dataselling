import { redirect } from "next/navigation";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ClaimItPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h2 className="text-xl font-bold text-white">ClaimIt</h2>
      <p className="text-sm text-white/55">
        Enter a promo or reward code from DCS to credit your wallet.
      </p>
      <form className="space-y-3 rounded-2xl border border-white/10 bg-navy-900 p-4">
        <label className="block text-xs font-semibold text-white/60">Promo code</label>
        <input
          type="text"
          placeholder="DCS-PROMO-XXXX"
          className="w-full rounded-xl border border-white/10 bg-navy-950 px-3 py-2.5 text-sm text-white focus:border-gold/40 focus:outline-none"
        />
        <button
          type="button"
          className="w-full rounded-xl bg-gold py-2.5 text-sm font-bold text-navy-950"
        >
          Claim reward
        </button>
        <p className="text-center text-[11px] text-white/35">
          No active promos on your account. Contact support on WhatsApp for campaigns.
        </p>
      </form>
    </div>
  );
}
