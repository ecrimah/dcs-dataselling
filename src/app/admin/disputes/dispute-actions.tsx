"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DisputeActions({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [resolution, setResolution] = useState("");

  async function resolve() {
    if (!resolution.trim()) {
      toast.error("Enter a resolution note");
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success("Dispute resolved");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
      <input
        type="text"
        placeholder="Resolution note"
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        className="min-w-[200px] flex-1 rounded-xl border border-border px-3 py-2 text-sm"
      />
      <Button onClick={resolve} disabled={pending}>
        {pending ? "Saving…" : "Resolve"}
      </Button>
    </div>
  );
}
