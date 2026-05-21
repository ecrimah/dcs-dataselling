import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { fetchPlatformStats } from "@/lib/data/queries";
import { formatCompact } from "@/lib/format";
import { VendorStoreEntry } from "@/components/store/vendor-store-entry";

export async function HeroSection() {
  const stats = await fetchPlatformStats();

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-20">
        <Image
          src="/hero-customer.png"
          alt="A customer in Accra buying data through their agent's DCS store"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "62% 28%" }}
        />
      </div>

      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: `
            linear-gradient(95deg,
              rgba(8, 31, 63, 0.94) 0%,
              rgba(8, 31, 63, 0.86) 30%,
              rgba(10, 46, 93, 0.55) 55%,
              rgba(10, 46, 93, 0.25) 80%,
              rgba(8, 31, 63, 0.55) 100%),
            linear-gradient(180deg,
              rgba(8, 31, 63, 0.0) 0%,
              rgba(8, 31, 63, 0.0) 55%,
              rgba(8, 31, 63, 0.85) 100%)
          `,
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 50% 40% at 8% 20%, rgba(212, 175, 55, 0.14), transparent 70%),
            radial-gradient(ellipse 40% 30% at 12% 90%, rgba(10, 46, 93, 0.35), transparent 70%)
          `,
        }}
      />

      <div className="relative mx-auto flex min-h-[576px] max-w-7xl flex-col px-4 pb-5 pt-8 sm:px-6 lg:min-h-[648px] lg:px-8 lg:pb-6 lg:pt-12">
        <div className="flex flex-1 items-center justify-center sm:justify-start">
          <div className="reveal-up mx-auto w-full max-w-xl text-center sm:mx-0 sm:text-left">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-xs font-semibold backdrop-blur sm:mx-0">
              <span className="pulse-dot" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-glow">
                Live · Your agent&apos;s store, powered by DCS
              </span>
            </div>

            <h1
              className="mt-4 text-[clamp(1.875rem,3vw+0.75rem,3.25rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white"
              style={{ textShadow: "0 4px 30px rgba(0, 0, 0, 0.55)" }}
            >
              Buy data faster,
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(120deg, #F4D160 0%, #D4AF37 50%, #F4D160 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                smarter.
              </span>
            </h1>

            <p
              className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-100 sm:mx-0"
              style={{ textShadow: "0 2px 16px rgba(0, 0, 0, 0.5)" }}
            >
              Open your agent&apos;s private store. Pay with MoMo. Receive in seconds
              across MTN, Telecel & AirtelTigo.
            </p>

            <ul className="mt-4 hidden flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-slate-200 sm:flex">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-gold-glow" />
                BoG-licensed rails
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-gold-glow" />
                {stats.successRate}% success rate
              </li>
            </ul>

            <div className="mx-auto mt-5 w-full max-w-md sm:mx-0">
              <VendorStoreEntry variant="hero" />
              <p className="mt-2 text-[11px] text-slate-300">
                Selling data?{" "}
                <Link
                  href="/create-store"
                  className="font-semibold text-gold-glow underline-offset-4 hover:underline"
                >
                  Create your own store
                </Link>
                <ArrowRight className="ml-0.5 inline-block h-3 w-3" />
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 hidden grid-cols-2 gap-x-4 gap-y-2 border-t border-white/15 pt-2.5 sm:grid sm:grid-cols-4 sm:gap-x-6 lg:gap-x-8">
          <Metric label="Bundles delivered" value={formatCompact(stats.ordersFulfilled)} />
          <Metric label="Networks" value="3" />
          <Metric label="Success rate" value={`${stats.successRate}%`} />
          <Metric label="Avg delivery" value="< 2 min" />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 sm:flex sm:items-baseline sm:gap-1.5">
      <p
        className="num text-base font-extrabold leading-none tracking-tight text-white"
        style={{ textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}
      >
        {value}
      </p>
      <p
        className="mt-0.5 text-[8px] font-semibold uppercase leading-none tracking-[0.1em] text-slate-400 sm:mt-0"
        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.35)" }}
      >
        {label}
      </p>
    </div>
  );
}
