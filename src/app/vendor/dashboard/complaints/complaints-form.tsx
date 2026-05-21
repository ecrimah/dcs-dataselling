"use client";

import { useState } from "react";
import { toast } from "sonner";

export function ComplaintsForm() {
  const [message, setMessage] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    toast.success("Complaint submitted — we will respond on WhatsApp");
    setMessage("");
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-white/10 bg-navy-900 p-4">
      <label className="block text-xs font-semibold text-white/60">Describe the issue</label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        placeholder="Failed order, wrong bundle, payment issue..."
        className="w-full rounded-xl border border-white/10 bg-navy-950 p-3 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none"
      />
      <button type="submit" className="w-full rounded-xl bg-gold py-2.5 text-sm font-bold text-navy-950">
        Submit complaint
      </button>
    </form>
  );
}
