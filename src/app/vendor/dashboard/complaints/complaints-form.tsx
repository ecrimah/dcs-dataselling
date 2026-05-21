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
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-white/10 bg-navy-900 p-4">
      <input
        type="text"
        placeholder="Subject (optional)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-navy-950 px-3 py-2.5 text-sm text-white focus:border-gold/40 focus:outline-none"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        placeholder="Failed order, wrong bundle, payment issue..."
        className="w-full rounded-xl border border-white/10 bg-navy-950 p-3 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading || message.length < 10}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-sm font-bold text-navy-950 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit complaint"}
      </button>
    </form>
  );
}
