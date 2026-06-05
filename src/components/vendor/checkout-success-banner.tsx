"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { formatGHS } from "@/lib/format";

export function CheckoutSuccessBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const isSuccess = searchParams.get("checkout") === "success";
  const reference = searchParams.get("ref");
  if (!isSuccess || !reference) return null;

  const total = Number(searchParams.get("total") ?? 0);
  const items = Number(searchParams.get("items") ?? 0);

  function dismiss() {
    router.replace("/vendor/dashboard", { scroll: false });
  }

  return (
    <section
      role="status"
      className="relative overflow-hidden rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-950/90 via-navy-900 to-navy-950 p-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-emerald-300">Bulk order placed</p>
          <p className="mt-1 text-xs leading-relaxed text-white/70">
            {items > 0 ? `${items} line${items === 1 ? "" : "s"}` : "Your order"} charged{" "}
            {total > 0 ? formatGHS(total) : "from wallet"} — queued for delivery.
          </p>
          <p className="mt-2 font-mono text-[11px] text-amber-300/90">{reference}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/vendor/dashboard/orders"
              className="inline-flex items-center rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-navy-950 hover:bg-gold-glow"
            >
              View orders
            </Link>
            <Link
              href="/vendor/dashboard/wholesale"
              className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              Buy more data
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white/70"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
