"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function KycReviewActions({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  async function approve() {
    setPending("approve");
    try {
      const res = await fetch(`/api/admin/kyc/${vendorId}/approve`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success("Vendor approved");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(null);
    }
  }

  async function reject() {
    if (!reason.trim()) {
      toast.error("Provide a rejection reason");
      return;
    }
    setPending("reject");
    try {
      const res = await fetch(`/api/admin/kyc/${vendorId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success("Vendor rejected");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
      <Button onClick={approve} disabled={pending !== null}>
        <CheckCircle2 className="h-4 w-4" />
        {pending === "approve" ? "Approving..." : "Approve"}
      </Button>
      <Button variant="ghost" onClick={() => setShowReject((s) => !s)} disabled={pending !== null}>
        <XCircle className="h-4 w-4" />
        Reject
      </Button>
      {showReject && (
        <div className="mt-2 flex w-full gap-2">
          <input
            type="text"
            placeholder="Rejection reason (visible to vendor)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm"
          />
          <Button variant="danger" onClick={reject} disabled={pending !== null}>
            Confirm reject
          </Button>
        </div>
      )}
    </div>
  );
}
