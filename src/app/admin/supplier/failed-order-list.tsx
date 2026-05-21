"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import type { FailedOrderRow } from "@/lib/data/supplier-logs";

export function FailedOrderList({ orders }: { orders: FailedOrderRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  async function retry(scope: FailedOrderRow["scope"], orderId: string) {
    setBusyId(orderId);
    setErrorById((m) => ({ ...m, [orderId]: "" }));
    try {
      const res = await fetch("/api/admin/supplier/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, orderId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setErrorById((m) => ({ ...m, [orderId]: data.error ?? "Retry failed" }));
      } else {
        startTransition(() => router.refresh());
      }
    } catch (err) {
      setErrorById((m) => ({
        ...m,
        [orderId]: err instanceof Error ? err.message : "Network error",
      }));
    } finally {
      setBusyId(null);
    }
  }

  if (orders.length === 0) {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
        No failed or stuck orders — all paid orders have been accepted by the supplier.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {orders.map((o) => {
        const isBusy = busyId === o.id || pending;
        return (
          <li key={`${o.scope}-${o.id}`} className="py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold text-foreground">{o.reference}</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {o.scope === "customer_order" ? "Customer order" : "Wholesale order"} ·{" "}
                  {formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })}
                </p>
                {o.supplierError && (
                  <p className="mt-1 text-[11px] text-red-600">{o.supplierError}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => retry(o.scope, o.id)}
                disabled={isBusy}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Retry
              </button>
            </div>
            {errorById[o.id] && (
              <p className="mt-1 text-[11px] text-red-600">{errorById[o.id]}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
