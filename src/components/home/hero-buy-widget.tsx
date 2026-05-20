"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Phone } from "lucide-react";
import { NETWORKS } from "@/lib/constants";
import type { NetworkId } from "@/lib/constants";
import type { QuickBuyOption } from "@/lib/data/queries";
import { cn } from "@/lib/utils";

interface HeroBuyWidgetProps {
  bundlesByNetwork: Record<NetworkId, QuickBuyOption[]>;
}

export function HeroBuyWidget({ bundlesByNetwork }: HeroBuyWidgetProps) {
  const router = useRouter();
  const [network, setNetwork] = useState<NetworkId>("mtn");
  const [bundleIdx, setBundleIdx] = useState(0);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const bundles = bundlesByNetwork[network] ?? [];
  const selected = bundles[bundleIdx];
  const phoneValid = /^0\d{9}$/.test(phone);

  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneValid || !selected) return;
    setLoading(true);
    router.push(`/checkout?bundle=${selected.id}&phone=${encodeURIComponent(phone)}`);
  }

  if (bundles.length === 0) {
    return (
      <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-center backdrop-blur">
        <p className="text-sm text-slate-200">Bundles loading soon.</p>
        <Link
          href="/marketplace"
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300 hover:underline"
        >
          Browse marketplace
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={go}
      className="overflow-hidden rounded-2xl border border-white/15 shadow-2xl"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow:
          "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-2 py-2">
        <div className="flex gap-0.5">
          {NETWORKS.filter((n) => (bundlesByNetwork[n.id]?.length ?? 0) > 0).map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                setNetwork(n.id);
                setBundleIdx(0);
              }}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-bold transition-all",
                network === n.id
                  ? "bg-white text-navy-900 shadow"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
            >
              {n.name}
            </button>
          ))}
        </div>
        <span className="hidden pr-1 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-300 sm:inline">
          Quick buy
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 p-2">
        {bundles.map((b, i) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBundleIdx(i)}
            className={cn(
              "rounded-lg border p-2 text-left transition-all",
              i === bundleIdx
                ? "border-cyan-400 bg-cyan-400/15 ring-1 ring-cyan-400/30"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]",
            )}
          >
            <p
              className={cn(
                "text-[12px] font-bold leading-tight",
                i === bundleIdx ? "text-white" : "text-slate-100",
              )}
            >
              {b.label}
            </p>
            <p
              className={cn(
                "mt-0.5 text-[10px] font-medium",
                i === bundleIdx ? "text-cyan-200" : "text-slate-400",
              )}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              ₵{b.price.toFixed(2)}
            </p>
          </button>
        ))}
      </div>

      <div className="border-t border-white/10 bg-black/30 p-2">
        <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.08] px-2 py-1 ring-1 ring-white/10 focus-within:ring-cyan-400/50">
          <Phone className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
          <span className="text-[11px] font-bold text-slate-300">+233</span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="024 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            className="flex-1 bg-transparent px-0.5 py-0.5 text-[13px] font-semibold text-white placeholder:text-slate-500 focus:outline-none"
            style={{ fontVariantNumeric: "tabular-nums" }}
          />
          <button
            type="submit"
            disabled={loading || !phoneValid || !selected}
            className="flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-xs font-extrabold text-navy-950 transition-all disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #D4AF37 0%, #F4D160 100%)",
              boxShadow: phoneValid
                ? "0 6px 18px rgba(34, 211, 238, 0.4), 0 2px 0 rgba(0,0,0,0.05) inset"
                : "none",
            }}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                Buy
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[10px] text-slate-400">
          {phoneValid && selected ? (
            <span className="font-semibold text-emerald-400">
              ✓ Ready · {selected.label} for ₵{selected.price.toFixed(2)}
            </span>
          ) : (
            "Enter the recipient phone number to continue"
          )}
        </p>
      </div>
    </form>
  );
}
