import Link from "next/link";
import { redirect } from "next/navigation";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { formatGHS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Rewards</h2>
        <p className="text-sm text-white/55">Earn when customers use your referral code.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-navy-900 p-4">
        <p className="text-[10px] font-bold uppercase text-white/40">Your referral code</p>
        <p className="mt-1 font-mono text-2xl font-bold text-gold">{vendor.referralCode}</p>
        <p className="mt-3 text-sm text-white/55">
          Share this when onboarding other agents. Rewards are tracked by DCS ops.
        </p>
      </div>
      <div id="withdraw" className="rounded-2xl border border-white/10 bg-navy-900 p-4">
        <h3 className="font-bold text-white">Reward withdrawal</h3>
        <p className="mt-1 text-sm text-white/55">Available balance</p>
        <p className="num mt-2 text-2xl font-bold text-gold">{formatGHS(0)}</p>
        <button
          type="button"
          disabled
          className="mt-4 w-full rounded-xl bg-white/10 py-2.5 text-sm font-bold text-white/40"
        >
          Withdraw to MoMo (coming soon)
        </button>
        <p className="mt-2 text-[11px] text-white/35">
          Minimum withdrawal ₵50. WhatsApp support to request manual payout.
        </p>
      </div>
      <Link href="/vendor/dashboard/storefront" className="text-sm font-bold text-gold">
        Share store to earn →
      </Link>
    </div>
  );
}
