"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface AfaStatus {
  agent_id: string;
  status: string;
  admin_note: string | null;
  submitted_at: string;
  verified_at: string | null;
}

interface Props {
  initial: AfaStatus | null;
}

export function MtnAfaForm({ initial }: Props) {
  const [agentId, setAgentId] = useState(initial?.agent_id ?? "");
  const [status, setStatus] = useState(initial?.status ?? null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/mtn-afa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setStatus("pending");
      toast.success("Application submitted for review");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {status && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Status:</span>
          <Badge variant={status === "verified" ? "success" : status === "rejected" ? "danger" : "warning"}>
            {status}
          </Badge>
        </div>
      )}
      <form onSubmit={submit} className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">Agent registration</p>
        <p className="mt-1 text-xs text-amber-700">
          Submit your MTN agent ID to unlock AFA-priced bundles.
        </p>
        <input
          type="text"
          placeholder="MTN Agent ID"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          disabled={status === "verified" || status === "pending"}
          className="mt-3 w-full rounded-xl border border-white/10 bg-navy-950 px-3 py-2.5 text-sm text-white focus:border-gold/40 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || status === "verified" || status === "pending"}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-sm font-bold text-navy-950 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for verification"}
        </button>
      </form>
    </div>
  );
}
