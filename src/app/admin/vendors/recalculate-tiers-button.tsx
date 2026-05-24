"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RecalculateTiersButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    try {
      const res = await fetch("/api/admin/vendors/recalculate-tiers", { method: "POST" });
      const data = (await res.json()) as { error?: string; promoted?: number };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(
        data.promoted && data.promoted > 0
          ? `Promoted ${data.promoted} agent${data.promoted === 1 ? "" : "s"} to a higher role`
          : "No agents qualified for promotion",
      );
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={run}
      className="gap-1.5"
    >
      <Sparkles className="h-3.5 w-3.5" />
      {pending ? "Checking…" : "Apply roles"}
    </Button>
  );
}
