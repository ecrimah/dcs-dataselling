"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

interface SmsTestFormProps {
  disabled?: boolean;
}

export function SmsTestForm({ disabled }: SmsTestFormProps) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "ok"; recipient: string; message: string }
    | { kind: "error"; error: string }
  >({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "idle" });

    try {
      const res = await fetch("/api/admin/sms/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          message: message.trim() || undefined,
        }),
      });
      const data = (await res.json()) as
        | { ok: true; recipient: string; message: string }
        | { ok: false; error: string };

      if (!res.ok || !("ok" in data) || !data.ok) {
        setStatus({
          kind: "error",
          error: "error" in data ? data.error : "Request failed",
        });
        return;
      }

      setStatus({ kind: "ok", recipient: data.recipient, message: data.message });
      setMessage("");
      startTransition(() => router.refresh());
    } catch (err) {
      setStatus({
        kind: "error",
        error: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  const remaining = 160 - message.length;

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="admin-form-field">
        <label>Recipient phone</label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0241234567 or 233241234567"
          disabled={disabled || pending}
        />
      </div>

      <div className="admin-form-field">
        <div className="flex items-center justify-between">
          <label>Message (optional)</label>
          <span
            className={`text-[10px] font-semibold ${
              remaining < 0 ? "text-red-600" : "text-muted"
            }`}
          >
            {remaining} chars
          </span>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 160))}
          rows={3}
          placeholder="Leave blank to send a default DCS test message."
          disabled={disabled || pending}
          className="resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={disabled || pending || !phone.trim()}
        className="susu-btn-gold flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Send test SMS
      </button>

      {status.kind === "ok" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          <p className="font-semibold">Sent to {status.recipient}</p>
          <p className="mt-1 text-emerald-700">&ldquo;{status.message}&rdquo;</p>
        </div>
      )}
      {status.kind === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
          <p className="font-semibold">Failed</p>
          <p className="mt-1">{status.error}</p>
        </div>
      )}
    </form>
  );
}
