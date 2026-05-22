import Link from "next/link";
import { ArrowRight, Clock, Flame, Sparkles, Zap } from "lucide-react";
import type { Bundle } from "@/types";
import { formatDataAmount, formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  bundle: Bundle;
  className?: string;
}

const NETWORK_STYLE: Record<
  Bundle["network"],
  {
    bg: string;
    text: string;
    label: string;
    stripe: string;
    glow: string;
  }
> = {
  mtn: {
    bg: "bg-amber-400",
    text: "text-slate-900",
    label: "MTN",
    stripe: "bg-amber-400",
    glow: "rgba(251, 191, 36, 0.18)",
  },
  telecel: {
    bg: "bg-rose-500",
    text: "text-white",
    label: "TELECEL",
    stripe: "bg-rose-500",
    glow: "rgba(244, 63, 94, 0.18)",
  },
  at: {
    bg: "bg-sky-600",
    text: "text-white",
    label: "AirtelTigo",
    stripe: "bg-sky-600",
    glow: "rgba(2, 132, 199, 0.18)",
  },
};

export function StorefrontBundleCard({ bundle, className }: Props) {
  const network = NETWORK_STYLE[bundle.network];
  const dataAmount = formatDataAmount(bundle.dataMb);
  const pricePerGB = bundle.dataMb > 0 ? bundle.price / (bundle.dataMb / 1024) : 0;
  const savings =
    bundle.originalPrice && bundle.originalPrice > bundle.price
      ? Math.round(
          ((bundle.originalPrice - bundle.price) / bundle.originalPrice) * 100,
        )
      : null;

  return (
    <Link
      href={`/checkout?bundle=${bundle.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04),0_8px_24px_rgba(10,46,93,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/40 hover:shadow-[0_4px_8px_rgba(17,17,17,0.05),0_16px_40px_rgba(10,46,93,0.10)]",
        className,
      )}
    >
      {/* Network stripe at top */}
      <div className={cn("h-1.5 w-full", network.stripe)} />

      {/* Soft network-coloured glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-60 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(closest-side, ${network.glow}, transparent)`,
        }}
      />

      <div className="relative flex flex-1 flex-col gap-3 p-4 sm:p-5">
        {/* Header row: network chip + badges */}
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-black tracking-wide shadow-sm sm:text-[11px]",
              network.bg,
              network.text,
            )}
          >
            {network.label}
          </span>
          <div className="flex flex-wrap justify-end gap-1">
            {bundle.popular && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/95 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white shadow-sm sm:text-[10px]">
                <Flame className="h-2.5 w-2.5" />
                Hot
              </span>
            )}
            {bundle.recommended && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-900 shadow-sm sm:text-[10px]">
                <Sparkles className="h-2.5 w-2.5" />
                Best
              </span>
            )}
          </div>
        </div>

        {/* HUGE data amount */}
        <div>
          <p
            className="font-extrabold leading-none tracking-tight text-slate-900"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            <span className="text-[40px] sm:text-[48px]">{dataAmount}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-600">
              <Clock className="h-3 w-3" />
              {bundle.validityDays} {bundle.validityDays === 1 ? "day" : "days"}
            </span>
            <span className="text-slate-500">
              <span className="font-semibold text-slate-700" style={{ fontVariantNumeric: "tabular-nums" }}>
                ₵{pricePerGB.toFixed(2)}
              </span>
              /GB
            </span>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="min-w-0">
            <p
              className="font-extrabold leading-none tracking-tight text-slate-900"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              <span className="text-xl sm:text-2xl">{formatGHS(bundle.price)}</span>
            </p>
            {bundle.originalPrice && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  className="text-[11px] text-slate-400 line-through"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatGHS(bundle.originalPrice)}
                </span>
                {savings != null && savings > 0 && (
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black text-emerald-700">
                    −{savings}%
                  </span>
                )}
              </div>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 px-3 py-2 text-[12px] font-black uppercase tracking-wide text-slate-900 shadow-md shadow-amber-400/30 transition-all group-hover:gap-1.5 group-hover:shadow-amber-400/50 sm:px-4 sm:py-2.5 sm:text-sm">
            Buy
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>

        {/* Live delivery hint */}
        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <Zap className="h-2.5 w-2.5" />
          Delivers in ~{bundle.vendor.fulfilmentMinutes ?? 2} min
        </div>
      </div>
    </Link>
  );
}
