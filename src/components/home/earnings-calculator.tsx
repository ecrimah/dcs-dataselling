"use client";

import { useMemo, useState, type ButtonHTMLAttributes } from "react";
import { Minus, Plus, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORM_FEE = 0.05;

export function EarningsCalculator() {
  const [bundlesPerDay, setBundlesPerDay] = useState(8);
  const [avgMarkup, setAvgMarkup] = useState(2.5);

  const earnings = useMemo(() => {
    const netPerDay = bundlesPerDay * avgMarkup * (1 - PLATFORM_FEE);
    return {
      perDay: netPerDay,
      perMonth: netPerDay * 30,
      perYear: netPerDay * 365,
    };
  }, [bundlesPerDay, avgMarkup]);

  const monthDisplay = earnings.perMonth.toLocaleString("en-GH", {
    maximumFractionDigits: 0,
  });
  const yearDisplay = earnings.perYear.toLocaleString("en-GH", {
    maximumFractionDigits: 0,
  });

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(6,9,20,0.35)]"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 100% 0%, rgba(34, 211, 238, 0.15), transparent 50%),
          radial-gradient(ellipse 60% 50% at 0% 100%, rgba(139, 92, 246, 0.12), transparent 50%),
          linear-gradient(165deg, #0a1124 0%, #060914 100%)
        `,
      }}
    >
      <div className="relative p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
            <TrendingUp className="h-3.5 w-3.5" />
            Live estimate
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-medium text-slate-400">
            After 5% fee
          </span>
        </div>

        <div className="mt-4">
          <p
            key={monthDisplay}
            className="num text-[clamp(2.25rem,5vw,3rem)] font-extrabold leading-none tracking-tight text-white"
          >
            ₵{monthDisplay}
          </p>
          <p className="mt-1 text-sm text-slate-400">/month take-home</p>
        </div>

        <div className="mt-3 flex gap-2">
          <MetricChip label="Daily" value={`₵${earnings.perDay.toFixed(0)}`} />
          <MetricChip label="Yearly" value={`₵${yearDisplay}`} />
        </div>

        <div className="mt-5 space-y-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm">
          <Stepper
            label="Bundles / day"
            value={bundlesPerDay}
            onChange={setBundlesPerDay}
            min={1}
            max={50}
          />
          <Stepper
            label="Markup"
            value={avgMarkup}
            onChange={setAvgMarkup}
            min={0.5}
            max={15}
            step={0.5}
            format={(v) => `₵${v.toFixed(1)}`}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setBundlesPerDay(preset.bundles);
                setAvgMarkup(preset.markup);
              }}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-300 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-200"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const PRESETS = [
  { label: "Side hustle", bundles: 5, markup: 2 },
  { label: "Reseller", bundles: 12, markup: 3 },
  { label: "Power seller", bundles: 25, markup: 4 },
] as const;

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex flex-1 items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="num text-sm font-bold text-white">{value}</span>
    </span>
  );
}

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format = (v: number) => String(v),
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
}) {
  function bump(delta: number) {
    const next = Math.min(max, Math.max(min, Number((value + delta).toFixed(2))));
    onChange(next);
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <div className="flex items-center gap-1">
        <StepperButton
          onClick={() => bump(-step)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </StepperButton>
        <span className="num min-w-[3.5rem] text-center text-sm font-bold text-white">
          {format(value)}
        </span>
        <StepperButton
          onClick={() => bump(step)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </StepperButton>
      </div>
    </div>
  );
}

function StepperButton({
  children,
  onClick,
  disabled,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition-colors",
        "hover:border-cyan-400/40 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-30",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
