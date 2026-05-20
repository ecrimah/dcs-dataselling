"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function QueueActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function updateStatus(status: string, label: string) {
    setPending(label);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success(label);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="secondary"
        disabled={pending !== null}
        onClick={() => updateStatus("processing", "Marked processing")}
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        disabled={pending !== null}
        onClick={() => updateStatus("fulfilled", "Marked fulfilled")}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
