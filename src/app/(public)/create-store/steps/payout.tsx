"use client";

import { Input } from "@/components/ui/input";
import { NETWORKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { StoreFormState } from "../wizard";

interface Props {
  form: StoreFormState;
  update: <K extends keyof StoreFormState>(k: K, v: StoreFormState[K]) => void;
}

export function StepPayout({ form, update }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Where should we pay you?</h2>
        <p className="mt-1 text-sm text-muted">
          Your earnings settle to this Mobile Money wallet daily.
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Network</p>
        <div className="grid grid-cols-3 gap-2">
          {NETWORKS.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => update("momoNetwork", n.id)}
              className={cn(
                "rounded-xl border p-3 text-sm font-semibold transition-colors",
                form.momoNetwork === n.id
                  ? "border-cyan-500 bg-cyan-500/5 text-cyan-700"
                  : "border-border hover:bg-slate-50",
              )}
            >
              {n.name}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="MoMo number"
        placeholder="0241234567"
        value={form.momoNumber}
        onChange={(e) => update("momoNumber", e.target.value)}
        hint="Must match your Ghana Card name."
      />

      <Input
        label="WhatsApp number for support (optional)"
        placeholder="0241234567"
        value={form.whatsapp}
        onChange={(e) => update("whatsapp", e.target.value)}
      />
    </div>
  );
}
