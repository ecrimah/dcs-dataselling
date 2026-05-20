import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function MarketplaceBanner() {
  return (
    <Link
      href="/create-store"
      className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-navy-800/20 bg-gradient-to-r from-navy-900 via-navy-900 to-navy-800 px-5 py-4 shadow-[0_16px_48px_rgba(6,9,20,0.2)] transition-shadow hover:shadow-[0_20px_56px_rgba(6,9,20,0.28)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 0% 50%, rgba(34, 211, 238, 0.25), transparent 70%)",
        }}
      />
      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-teal-500/20 ring-1 ring-cyan-400/30">
          <Sparkles className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Sell data on DCS</p>
          <p className="text-xs text-slate-400">
            Your storefront · MoMo payouts · ~5 min setup
          </p>
        </div>
      </div>
      <span className="relative flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-300 ring-1 ring-white/10 transition-colors group-hover:bg-white/15">
        Create store
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
