"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function WithdrawalActions({
  withdrawalId,
  status,
}: {
  withdrawalId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState("");

  async function update(nextStatus: "approved" | "paid" | "rejected") {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/reward-withdrawals/${withdrawalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, adminNote: note || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success(`Withdrawal ${nextStatus}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  if (status === "paid" || status === "rejected") return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
      <input
        type="text"
        placeholder="Admin note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-w-[180px] flex-1 rounded-xl border border-border px-3 py-2 text-sm"
      />
      {status === "pending" && (
        <>
          <Button size="sm" variant="secondary" onClick={() => update("approved")} disabled={pending}>
            Approve
          </Button>
          <Button size="sm" onClick={() => update("paid")} disabled={pending}>
            Mark paid
          </Button>
          <Button size="sm" variant="danger" onClick={() => update("rejected")} disabled={pending}>
            Reject
          </Button>
        </>
      )}
      {status === "approved" && (
        <Button size="sm" onClick={() => update("paid")} disabled={pending}>
          Mark paid
        </Button>
      )}
    </div>
  );
}

export function ComplaintActions({
  complaintId,
  status,
  existingReply,
}: {
  complaintId: string;
  status: string;
  existingReply: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [reply, setReply] = useState(existingReply ?? "");
  const [nextStatus, setNextStatus] = useState(status);

  async function save() {
    if (!reply.trim()) {
      toast.error("Enter a reply for the agent");
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/admin/complaints/${complaintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, adminReply: reply }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success("Complaint updated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  if (status === "closed") return null;

  return (
    <div className="mt-4 space-y-2 border-t border-border pt-4">
      <textarea
        placeholder="Reply to agent"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={2}
        className="w-full rounded-xl border border-border px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value)}
          className="rounded-xl border border-border px-3 py-2 text-sm"
        >
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save reply"}
        </Button>
      </div>
    </div>
  );
}

export function MtnAfaActions({
  applicationId,
  status,
}: {
  applicationId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState("");

  async function review(nextStatus: "verified" | "rejected") {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/mtn-afa/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, adminNote: note || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success(nextStatus === "verified" ? "Agent verified" : "Application rejected");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  if (status !== "pending") return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
      <input
        type="text"
        placeholder="Note to agent (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-w-[180px] flex-1 rounded-xl border border-border px-3 py-2 text-sm"
      />
      <Button size="sm" onClick={() => review("verified")} disabled={pending}>
        Verify
      </Button>
      <Button size="sm" variant="danger" onClick={() => review("rejected")} disabled={pending}>
        Reject
      </Button>
    </div>
  );
}

export function ApiKeyRevokeButton({ keyId, active }: { keyId: string; active: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function revoke() {
    if (!confirm("Revoke this API key? The agent will need to generate a new one.")) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/vendor-api-keys/${keyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success("API key revoked");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  if (!active) return <span className="text-xs text-muted">Revoked</span>;

  return (
    <Button size="sm" variant="danger" onClick={revoke} disabled={pending}>
      {pending ? "…" : "Revoke"}
    </Button>
  );
}
