"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Activity, Loader2 } from "lucide-react";

export function SupplierPingButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "ok"; networks: unknown }
    | { kind: "error"; error: string }
  >({ kind: "idle" });

  async function ping() {
    setStatus({ kind: "idle" });
    try {
      const res = await fetch("/api/admin/supplier/ping", { method: "POST" });
      const data = (await res.json()) as
        | { ok: true; networks: unknown }
        | { ok: false; error: string };
      if (!res.ok || !("ok" in data) || !data.ok) {
        setStatus({
          kind: "error",
          error: "error" in data ? data.error : "Ping failed",
        });
        return;
      }
      setStatus({ kind: "ok", networks: data.networks });
      startTransition(() => router.refresh());
    } catch (err) {
      setStatus({
        kind: "error",
        error: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={ping}
        disabled={disabled || pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
        Ping /fetch-networks
      </button>

      {status.kind === "ok" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          <p className="font-semibold">Connected. Networks returned:</p>
          <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-white p-2 font-mono text-[11px] text-foreground">
            {JSON.stringify(status.networks, null, 2)}
          </pre>
        </div>
      )}
      {status.kind === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
          <p className="font-semibold">Ping failed</p>
          <p className="mt-1">{status.error}</p>
        </div>
      )}
    </div>
  );
}
