import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Headphones,
  Lock,
  ShieldCheck,
  Timer,
  Zap,
} from "lucide-react";
import { fetchPlatformStats } from "@/lib/data/queries";
import { formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TrustParallaxShell } from "./trust-parallax-shell";

export async function TrustSection() {
  const stats = await fetchPlatformStats();

  const pillars = [
    {
      icon: ShieldCheck,
      stat: `${stats.activeVendors}+`,
      statLabel: "verified vendors",
      title: "Verified by DCS",
      description: "Ghana Card KYC before any vendor can sell.",
      className: "lg:col-span-5",
    },
    {
      icon: Lock,
      stat: "BoG",
      statLabel: "licensed rails",
      title: "Licensed payments",
      description: "Paystack & Moolre — webhook-verified, encrypted.",
      className: "lg:col-span-7",
      featured: true,
    },
    {
      icon: Timer,
      stat: `${stats.successRate}%`,
      statLabel: "success rate",
      title: "Instant fulfilment",
      description: "Avg delivery under 2 minutes. Track every order live.",
      className: "lg:col-span-6",
    },
    {
      icon: Headphones,
      stat: "<5m",
      statLabel: "response target",
      title: "Human support",
      description: "WhatsApp & email. Failed orders auto-refund.",
      className: "lg:col-span-6",
    },
  ];

  const badges = [
    { icon: Lock, label: "256-bit TLS" },
    { label: "Paystack · BoG" },
    { label: "Moolre · BoG" },
    { label: "PCI-DSS aligned" },
    { icon: BadgeCheck, label: "Ghana Card KYC" },
    { icon: Zap, label: `${formatCompact(stats.ordersFulfilled)} delivered` },
  ];

  return (
    <TrustParallaxShell>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <span className="eyebrow text-cyan-300">Built on trust</span>
            <h2 className="mt-1.5 text-xl font-extrabold tracking-tight text-white sm:mt-2 sm:text-3xl lg:text-4xl">
              Built like a bank.{" "}
              <span className="text-aurora">Moves like fintech.</span>
            </h2>
            <p className="mt-1 text-xs text-slate-400 sm:mt-2 sm:text-sm">
              KYC, licensed rails, SLA fulfilment, dispute protection.
            </p>
          </div>

          <div className="hidden flex-wrap gap-2 sm:flex lg:justify-end">
            {[
              { value: formatCompact(stats.ordersFulfilled), label: "Delivered" },
              { value: `${stats.successRate}%`, label: "Success" },
              { value: formatCompact(stats.activeVendors), label: "Vendors" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-sm"
              >
                <p className="num text-xl font-extrabold text-white">{s.value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-3 lg:grid-cols-12">
          {pillars.map((p) => (
            <div
              key={p.title}
              className={cn(
                "group relative overflow-hidden rounded-xl border border-white/10 p-2.5 transition-colors hover:border-cyan-400/30 sm:rounded-2xl sm:p-5",
                p.featured
                  ? "col-span-2 bg-gradient-to-br from-cyan-500/15 via-white/5 to-violet-500/10 lg:col-span-7"
                  : "bg-white/[0.04] backdrop-blur-sm",
                !p.featured && p.className,
              )}
            >
              {p.featured && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-8 -top-8 hidden h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl sm:block"
                />
              )}

              <div className="relative flex items-start justify-between gap-1.5 sm:gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl",
                    p.featured
                      ? "bg-gradient-to-br from-cyan-400 to-teal-500 text-navy-950 shadow-lg shadow-cyan-500/25"
                      : "bg-white/10 text-cyan-300",
                  )}
                >
                  <p.icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
                </span>
                <div className="text-right">
                  <p className="num text-sm font-extrabold leading-none text-white sm:text-lg">
                    {p.stat}
                  </p>
                  <p className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-cyan-300/80 sm:text-[9px]">
                    {p.statLabel}
                  </p>
                </div>
              </div>

              <h3 className="relative mt-2 text-xs font-bold text-white sm:mt-4 sm:text-sm">
                {p.title}
              </h3>
              <p className="relative mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-400 sm:mt-1 sm:line-clamp-none sm:text-xs sm:leading-relaxed">
                {p.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-col items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 backdrop-blur-sm sm:mt-6 sm:gap-4 sm:rounded-2xl sm:px-6 sm:py-4 lg:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start sm:gap-2">
            {badges.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-slate-300 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[10px]"
              >
                {b.icon && <b.icon className="h-2.5 w-2.5 text-cyan-400 sm:h-3 sm:w-3" />}
                {b.label}
              </span>
            ))}
          </div>
          <Link
            href="/#trust"
            className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-cyan-300 transition-colors hover:text-cyan-200 sm:text-xs"
          >
            Security centre
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Link>
        </div>
      </div>
    </TrustParallaxShell>
  );
}
