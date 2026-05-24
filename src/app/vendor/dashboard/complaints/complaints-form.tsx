"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ComplaintsForm() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, subject: subject || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submit failed");
      toast.success("Complaint submitted — we will respond soon");
      setMessage("");
      setSubject("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="admin-form-field">
        <label>Subject (optional)</label>
        <input
          type="text"
          placeholder="Brief summary"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div className="admin-form-field">
        <label>Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Failed order, wrong bundle, payment issue..."
          className="resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading || message.length < 10}
        className="susu-btn-gold flex w-full items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit complaint"}
      </button>
    </form>
  );
}
