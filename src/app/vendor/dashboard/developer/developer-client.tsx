"use client";

import { useState } from "react";
import { Copy, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  active: boolean;
  created_at: string;
}

interface Props {
  initialKeys: ApiKeyRow[];
}

export function DeveloperClient({ initialKeys }: Props) {
  const [keys, setKeys] = useState(initialKeys);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function createKey() {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/developer/keys", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setNewKey(data.key.key);
      setKeys((k) => [
        {
          id: data.key.id,
          name: data.key.name,
          key_prefix: data.key.key_prefix,
          active: true,
          created_at: data.key.created_at,
        },
        ...k,
      ]);
      toast.success("API key created — copy it now");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function revoke(id: string) {
    await fetch("/api/vendor/developer/keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId: id }),
    });
    setKeys((k) => k.map((x) => (x.id === id ? { ...x, active: false } : x)));
    toast.success("Key revoked");
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <button
        type="button"
        onClick={createKey}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-sm font-bold text-navy-950"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate API key"}
      </button>

      {newKey && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="text-xs font-bold text-emerald-400">Copy now — shown once</p>
          <code className="mt-2 block break-all text-xs text-white">{newKey}</code>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(newKey);
              toast.success("Copied");
            }}
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-gold"
          >
            <Copy className="h-3 w-3" /> Copy
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-navy-900 p-4 font-mono text-xs text-white/70">
        <p className="text-white/40"># Authenticated endpoints</p>
        <p className="mt-2">Header: Authorization: Bearer YOUR_KEY</p>
        <p className="mt-1">POST /api/vendor/wholesale/orders</p>
        <p>POST /api/vendor/wholesale/orders/bulk</p>
        <p>GET /api/vendor/wallet</p>
      </div>

      <ul className="space-y-2">
        {keys.map((k) => (
          <li
            key={k.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-navy-900 px-3 py-2.5 text-sm"
          >
            <div>
              <p className="font-semibold">{k.name}</p>
              <p className="font-mono text-xs text-white/45">{k.key_prefix}…</p>
            </div>
            {k.active && (
              <button type="button" onClick={() => revoke(k.id)} className="text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
