"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PendingOrder {
  id: string;
  reference: string;
  amount: number;
  recipient: string;
  vendor: string;
  bundle: string;
}

interface Props {
  smsId: string;
  pendingOrders: PendingOrder[];
}

export function ManualMatchControl({ smsId, pendingOrders }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>("");
  const [pending, startTransition] = useTransition();

  async function handleMatch() {
    if (!selected) {
      toast.error("Pick an order to match");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/admin/momo-sms/${smsId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not match");
        return;
      }
      toast.success("Order paid + dispatched");
      router.refresh();
    });
  }

  async function handleReject() {
    if (!confirm("Mark this SMS as resolved without matching to an order?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/momo-sms/${smsId}/reject`, { method: "POST" });
      if (!res.ok) {
        toast.error("Could not reject");
        return;
      }
      toast.success("SMS dismissed");
      router.refresh();
    });
  }

  if (pendingOrders.length === 0) {
    return (
      <button
        type="button"
        onClick={handleReject}
        disabled={pending}
        className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70 hover:bg-white/10 disabled:opacity-50"
      >
        Dismiss
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        disabled={pending}
        className="h-8 max-w-[220px] rounded-md border border-white/10 bg-white/5 px-2 text-[11px] text-white"
      >
        <option value="">— pick order —</option>
        {pendingOrders.map((o) => (
          <option key={o.id} value={o.id}>
            {o.reference} · ₵{o.amount.toFixed(2)} · {o.vendor}
          </option>
        ))}
      </select>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={handleMatch}
          disabled={pending || !selected}
          className="flex-1 rounded-md bg-amber-500 px-2 py-1 text-[11px] font-bold text-navy-950 disabled:opacity-50"
        >
          {pending ? "…" : "Match"}
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={pending}
          className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/60 hover:bg-white/10 disabled:opacity-50"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
