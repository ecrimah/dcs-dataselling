"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatGHS } from "@/lib/format";

export function ClaimItForm() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Claim failed");
      toast.success(`${formatGHS(data.amount)} credited to your wallet`);
      setCode("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="admin-form-field">
        <label>Promo code</label>
        <input
          type="text"
          placeholder="DCS-WELCOME-50"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="font-semibold uppercase"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="susu-btn-gold flex w-full items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim reward"}
      </button>
      <p className="text-center text-[11px] text-muted">
        Try <span className="admin-promo-code">DCS-WELCOME-50</span> or{" "}
        <span className="admin-promo-code">DCS-CLAIMIT-10</span> (once per agent)
      </p>
    </form>
  );
}
