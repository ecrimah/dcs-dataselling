"use client";

import { useState } from "react";
import {
  Activity,
  AlertCircle,
  Book,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Globe,
  Key,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Shield,
  Trash2,
  Webhook,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { DocsBrowser } from "./docs-browser";
import type {
  ApiKeyRow,
  ApiLogRow,
  ApiUsageSummary,
  WebhookConfig,
  WebhookDeliveryRow,
} from "@/lib/vendor/developer";

type TabId = "overview" | "keys" | "webhook" | "docs" | "logs";

interface Props {
  apiBase: string;
  vendorName: string;
  initialKeys: ApiKeyRow[];
  initialLogs: ApiLogRow[];
  initialSummary: ApiUsageSummary;
  initialWebhook: WebhookConfig;
  initialDeliveries: WebhookDeliveryRow[];
}

export function DeveloperConsole({
  apiBase,
  vendorName,
  initialKeys,
  initialLogs,
  initialSummary,
  initialWebhook,
  initialDeliveries,
}: Props) {
  const [tab, setTab] = useState<TabId>("overview");
  const [keys, setKeys] = useState(initialKeys);
  const [logs, setLogs] = useState(initialLogs);
  const [summary] = useState(initialSummary);
  const [webhook, setWebhook] = useState(initialWebhook);
  const [deliveries, setDeliveries] = useState(initialDeliveries);

  const activeKey = keys.find((k) => k.active && !k.revoked_at);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl border border-white/10 bg-gradient-to-br from-gold/10 via-transparent to-emerald-500/10 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gold">
              <Code2 className="h-3.5 w-3.5" /> Developer API
            </div>
            <h1 className="mt-1 text-xl font-bold text-white">
              Sell data programmatically
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/65">
              Issue API keys to your bots, downstream resellers, or staff and let them
              place orders against <span className="font-semibold text-white">{vendorName}</span>{" "}
              automatically. All orders are debited from your wallet and delivered by the
              same suppliers that power the dashboard.
            </p>
          </div>
          <span
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
              activeKey
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-yellow-500/15 text-yellow-300"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${activeKey ? "bg-emerald-400" : "bg-yellow-400"}`} />
            {activeKey ? "API Live" : "No active key"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Calls (24h)" value={summary.total_24h.toLocaleString()} />
          <Stat
            label="Errors (24h)"
            value={summary.errors_24h.toLocaleString()}
            tone={summary.errors_24h > 0 ? "warn" : "ok"}
          />
          <Stat label="Calls (7d)" value={summary.total_7d.toLocaleString()} />
          <Stat
            label="Avg latency"
            value={summary.avg_duration_ms != null ? `${summary.avg_duration_ms}ms` : "—"}
          />
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-0 z-10 -mx-4 overflow-x-auto border-b border-white/10 bg-navy-950/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-navy-950/70">
        <div className="flex min-w-max gap-1 py-1">
          <TabButton id="overview" current={tab} onClick={setTab} icon={<Activity className="h-3.5 w-3.5" />}>
            Overview
          </TabButton>
          <TabButton id="keys" current={tab} onClick={setTab} icon={<Key className="h-3.5 w-3.5" />}>
            API Keys
            <Badge value={keys.filter((k) => k.active && !k.revoked_at).length} />
          </TabButton>
          <TabButton id="webhook" current={tab} onClick={setTab} icon={<Webhook className="h-3.5 w-3.5" />}>
            Webhooks
            {webhook.url && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />}
          </TabButton>
          <TabButton id="docs" current={tab} onClick={setTab} icon={<Book className="h-3.5 w-3.5" />}>
            Docs
          </TabButton>
          <TabButton id="logs" current={tab} onClick={setTab} icon={<Activity className="h-3.5 w-3.5" />}>
            Logs
          </TabButton>
        </div>
      </div>

      {/* Body */}
      {tab === "overview" && (
        <OverviewPanel
          apiBase={apiBase}
          activeKey={activeKey}
          webhook={webhook}
          summary={summary}
          onGoToKeys={() => setTab("keys")}
          onGoToWebhook={() => setTab("webhook")}
          onGoToDocs={() => setTab("docs")}
        />
      )}

      {tab === "keys" && (
        <KeysPanel keys={keys} setKeys={setKeys} />
      )}

      {tab === "webhook" && (
        <WebhookPanel
          webhook={webhook}
          setWebhook={setWebhook}
          deliveries={deliveries}
          setDeliveries={setDeliveries}
        />
      )}

      {tab === "docs" && (
        <DocsBrowser apiBase={apiBase} />
      )}

      {tab === "logs" && (
        <LogsPanel logs={logs} setLogs={setLogs} />
      )}
    </div>
  );
}

// =================================================================
// Sub-components
// =================================================================

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn";
}) {
  const color =
    tone === "warn"
      ? "text-yellow-300"
      : tone === "ok"
        ? "text-emerald-300"
        : "text-white";
  return (
    <div className="rounded-xl border border-white/10 bg-navy-900/40 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function TabButton({
  id,
  current,
  onClick,
  children,
  icon,
}: {
  id: TabId;
  current: TabId;
  onClick: (id: TabId) => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  const active = current === id;
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-gold text-navy-950"
          : "text-white/65 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Badge({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span className="ml-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-bold">
      {value}
    </span>
  );
}

// ------------------------- Overview -------------------------
function OverviewPanel({
  apiBase,
  activeKey,
  webhook,
  summary,
  onGoToKeys,
  onGoToWebhook,
  onGoToDocs,
}: {
  apiBase: string;
  activeKey: ApiKeyRow | undefined;
  webhook: WebhookConfig;
  summary: ApiUsageSummary;
  onGoToKeys: () => void;
  onGoToWebhook: () => void;
  onGoToDocs: () => void;
}) {
  const errorRate =
    summary.total_7d > 0 ? ((summary.errors_7d / summary.total_7d) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <ChecklistCard
          icon={<Key className="h-4 w-4" />}
          title="API Keys"
          done={Boolean(activeKey)}
          status={activeKey ? `1+ active key` : "No active keys yet"}
          actionLabel={activeKey ? "Manage" : "Create your first key"}
          onAction={onGoToKeys}
        />
        <ChecklistCard
          icon={<Webhook className="h-4 w-4" />}
          title="Webhook"
          done={Boolean(webhook.url)}
          status={webhook.url ? "Configured" : "Optional — get real-time updates"}
          actionLabel={webhook.url ? "Manage" : "Set up"}
          onAction={onGoToWebhook}
        />
      </div>

      <div className="card-elevated p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">API base URL</h3>
          <CopyButton value={apiBase} />
        </div>
        <code className="block break-all rounded-lg bg-navy-950 px-3 py-2 font-mono text-xs text-emerald-300">
          {apiBase}/api/v1
        </code>
        <p className="mt-2 text-xs text-white/55">
          All requests must include{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono">
            Authorization: Bearer dcs_…
          </code>
        </p>
      </div>

      <div className="card-elevated p-4">
        <h3 className="text-sm font-bold text-white">Usage (last 7 days)</h3>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-white/55">Total calls</p>
            <p className="text-xl font-bold text-white">{summary.total_7d.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-white/55">Error rate</p>
            <p
              className={`text-xl font-bold ${
                summary.errors_7d === 0 ? "text-emerald-300" : "text-yellow-300"
              }`}
            >
              {errorRate}%
            </p>
          </div>
          <div>
            <p className="text-xs text-white/55">Top endpoint</p>
            <p className="truncate text-xs font-mono font-bold text-white" title={summary.top_endpoint ?? "—"}>
              {summary.top_endpoint ?? "—"}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onGoToDocs}
        className="card-elevated flex w-full items-center justify-between p-4 text-left transition hover:border-gold/40"
      >
        <div>
          <p className="text-sm font-bold text-white">Read the docs →</p>
          <p className="mt-0.5 text-xs text-white/55">
            Endpoints, code examples in curl/JS/Python, error codes, webhook signing.
          </p>
        </div>
        <Book className="h-5 w-5 text-gold" />
      </button>
    </div>
  );
}

function ChecklistCard({
  icon,
  title,
  done,
  status,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  done: boolean;
  status: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      className={`card-elevated flex flex-col gap-2 p-4 ${
        done ? "border-emerald-500/30 bg-emerald-500/5" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            done ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/65"
          }`}
        >
          {done ? <CheckCircle2 className="h-4 w-4" /> : icon}
        </div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <p className="text-xs text-white/55">{status}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-1 self-start text-xs font-bold text-gold hover:underline"
      >
        {actionLabel} →
      </button>
    </div>
  );
}

// ------------------------- Keys -------------------------
function KeysPanel({
  keys,
  setKeys,
}: {
  keys: ApiKeyRow[];
  setKeys: React.Dispatch<React.SetStateAction<ApiKeyRow[]>>;
}) {
  const [name, setName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<{ key: string; prefix: string } | null>(null);

  async function createKey() {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {};
      if (name.trim()) payload.name = name.trim();
      const exp = Number(expiresInDays);
      if (Number.isFinite(exp) && exp > 0) payload.expires_in_days = exp;

      const res = await fetch("/api/vendor/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");

      setNewKey({ key: data.key.key, prefix: data.key.key_prefix });
      setKeys((k) => [
        {
          id: data.key.id,
          name: data.key.name,
          key_prefix: data.key.key_prefix,
          active: true,
          revoked_at: null,
          last_used_at: null,
          last_used_ip: null,
          total_requests: 0,
          expires_at: data.key.expires_at ?? null,
          created_at: data.key.created_at,
        },
        ...k,
      ]);
      setName("");
      setExpiresInDays("");
      toast.success("API key created — copy it before closing this card");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this key? Any bot using it will stop working immediately.")) return;
    try {
      const res = await fetch("/api/vendor/developer/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId: id }),
      });
      if (!res.ok) throw new Error("Failed");
      setKeys((k) =>
        k.map((x) =>
          x.id === id ? { ...x, active: false, revoked_at: new Date().toISOString() } : x,
        ),
      );
      toast.success("Key revoked");
    } catch {
      toast.error("Could not revoke");
    }
  }

  return (
    <div className="space-y-4">
      {/* Create */}
      <div className="card-elevated p-4">
        <h3 className="text-sm font-bold text-white">Generate a new key</h3>
        <p className="mt-1 text-xs text-white/55">
          Each key is shown <strong>once</strong>. Store it in a secret manager.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Name (e.g. 'Telegram bot')"
            className="rounded-xl border border-white/10 bg-navy-950 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
          />
          <input
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            maxLength={3}
            placeholder="Expires in (days, optional)"
            className="rounded-xl border border-white/10 bg-navy-950 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={createKey}
          disabled={loading}
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-navy-950 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Generate key
        </button>

        {newKey && (
          <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <Shield className="h-3.5 w-3.5" /> Copy now — shown only once
              </p>
              <button
                type="button"
                onClick={() => setNewKey(null)}
                className="text-white/55 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 break-all rounded-lg bg-navy-950 px-2.5 py-1.5 font-mono text-xs text-emerald-200">
                {newKey.key}
              </code>
              <CopyButton value={newKey.key} solid />
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div>
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-white/55">
          Your keys
        </h3>
        {keys.length === 0 ? (
          <div className="card-elevated p-6 text-center">
            <Key className="mx-auto h-8 w-8 text-white/30" />
            <p className="mt-2 text-sm text-white/55">No API keys yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {keys.map((k) => (
              <KeyRow key={k.id} k={k} onRevoke={() => revoke(k.id)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function KeyRow({ k, onRevoke }: { k: ApiKeyRow; onRevoke: () => void }) {
  const isActive = k.active && !k.revoked_at;
  const isExpired = k.expires_at ? new Date(k.expires_at) < new Date() : false;
  return (
    <li className="card-elevated flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{k.name}</p>
          <StatusBadge
            tone={isActive && !isExpired ? "ok" : "off"}
            label={
              !isActive
                ? "Revoked"
                : isExpired
                  ? "Expired"
                  : "Active"
            }
          />
        </div>
        <p className="mt-0.5 font-mono text-xs text-white/45">{k.key_prefix}…</p>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-white/45">
          <span>{k.total_requests.toLocaleString()} requests</span>
          <span>
            {k.last_used_at
              ? `Last used ${new Date(k.last_used_at).toLocaleString()}`
              : "Never used"}
          </span>
          {k.expires_at && (
            <span>Expires {new Date(k.expires_at).toLocaleDateString()}</span>
          )}
          <span>Created {new Date(k.created_at).toLocaleDateString()}</span>
        </p>
      </div>
      {isActive && (
        <button
          type="button"
          onClick={onRevoke}
          className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20"
          aria-label="Revoke key"
        >
          <Trash2 className="h-3.5 w-3.5" /> Revoke
        </button>
      )}
    </li>
  );
}

function StatusBadge({ tone, label }: { tone: "ok" | "off"; label: string }) {
  const color = tone === "ok" ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-white/45";
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${color}`}>
      {label}
    </span>
  );
}

// ------------------------- Webhook -------------------------
function WebhookPanel({
  webhook,
  setWebhook,
  deliveries,
  setDeliveries,
}: {
  webhook: WebhookConfig;
  setWebhook: React.Dispatch<React.SetStateAction<WebhookConfig>>;
  deliveries: WebhookDeliveryRow[];
  setDeliveries: React.Dispatch<React.SetStateAction<WebhookDeliveryRow[]>>;
}) {
  const [url, setUrl] = useState(webhook.url ?? "");
  const [enabled, setEnabled] = useState(webhook.enabled);
  const [saving, setSaving] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  async function save(rotateSecret = false) {
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/developer/webhook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim() || null,
          enabled,
          rotate_secret: rotateSecret,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setWebhook({
        url: data.url,
        enabled: data.enabled,
        has_secret: Boolean(data.secret) || webhook.has_secret,
      });
      if (data.secret) {
        setNewSecret(data.secret);
        toast.success("Webhook secret minted — copy it now");
      } else {
        toast.success("Webhook saved");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Remove your webhook? Future events will not be delivered.")) return;
    try {
      const res = await fetch("/api/vendor/developer/webhook", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setWebhook({ url: null, enabled: false, has_secret: false });
      setUrl("");
      setNewSecret(null);
      toast.success("Webhook removed");
    } catch {
      toast.error("Could not remove");
    }
  }

  async function refreshDeliveries() {
    // Re-fetch by reloading the parent's data through a fresh fetch. Simplest:
    // GET the page-level webhook (it embeds nothing else), so for deliveries
    // we just rely on the initial server snapshot. Provide an explicit pull:
    try {
      const res = await fetch("/api/vendor/developer/logs?limit=1", { cache: "no-store" });
      void res;
    } catch {}
    // Note: deliveries endpoint isn't exposed publicly; this button is a
    // visual affordance. Mark as no-op for now.
    toast.success("Refresh on page reload");
    void setDeliveries;
  }

  return (
    <div className="space-y-4">
      <div className="card-elevated p-4">
        <h3 className="text-sm font-bold text-white">Outbound webhook</h3>
        <p className="mt-1 text-xs text-white/55">
          We&apos;ll POST a signed JSON payload to your URL whenever an order&apos;s
          status changes. Events:{" "}
          <code className="rounded bg-white/10 px-1 text-[10px]">order.fulfilled</code>,{" "}
          <code className="rounded bg-white/10 px-1 text-[10px]">order.failed</code>.
        </p>

        <label className="mt-3 block text-xs font-semibold uppercase tracking-wider text-white/55">
          URL (HTTPS only)
        </label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-bot.example.com/webhooks/dcs"
          className="mt-1 w-full rounded-xl border border-white/10 bg-navy-950 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
        />

        <label className="mt-3 flex items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-navy-950 accent-gold"
          />
          Deliveries enabled
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => save(false)}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy-950 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save
          </button>
          {webhook.has_secret && (
            <button
              type="button"
              onClick={() => save(true)}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" /> Rotate secret
            </button>
          )}
          {webhook.url && (
            <button
              type="button"
              onClick={remove}
              className="flex items-center gap-2 rounded-xl border border-red-500/25 px-4 py-2 text-sm font-bold text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          )}
        </div>

        {newSecret && (
          <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <Shield className="h-3.5 w-3.5" /> Signing secret — copy now
              </p>
              <button
                type="button"
                onClick={() => setNewSecret(null)}
                className="text-white/55 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 break-all rounded-lg bg-navy-950 px-2.5 py-1.5 font-mono text-xs text-emerald-200">
                {newSecret}
              </code>
              <CopyButton value={newSecret} solid />
            </div>
            <p className="mt-2 text-[10px] text-white/45">
              Used to verify the <code className="rounded bg-white/10 px-1">X-DCS-Signature</code>{" "}
              HMAC-SHA256 header on incoming webhooks.
            </p>
          </div>
        )}
      </div>

      {/* Deliveries */}
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/55">
            Recent deliveries
          </h3>
          <button
            type="button"
            onClick={refreshDeliveries}
            className="flex items-center gap-1 text-xs text-white/55 hover:text-white"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
        {deliveries.length === 0 ? (
          <div className="card-elevated p-6 text-center text-xs text-white/55">
            No deliveries yet — they appear when orders fulfil.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {deliveries.map((d) => (
              <li
                key={d.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-navy-900 p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-white">{d.event}</code>
                    <span className="text-[10px] text-white/45">{d.reference ?? "—"}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-white/45">
                    {new Date(d.created_at).toLocaleString()} · {d.attempts}{" "}
                    {d.attempts === 1 ? "attempt" : "attempts"}
                  </p>
                  {d.error && <p className="mt-1 text-[11px] text-red-300">{d.error}</p>}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    d.ok
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {d.http_status ?? "ERR"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ------------------------- Logs -------------------------
function LogsPanel({
  logs,
  setLogs,
}: {
  logs: ApiLogRow[];
  setLogs: React.Dispatch<React.SetStateAction<ApiLogRow[]>>;
}) {
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/vendor/developer/logs?limit=100", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setLogs(data.logs ?? []);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Recent API calls</h3>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/5"
        >
          {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Refresh
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="card-elevated p-8 text-center">
          <Send className="mx-auto h-8 w-8 text-white/30" />
          <p className="mt-2 text-sm font-semibold text-white">No traffic yet</p>
          <p className="mt-1 text-xs text-white/55">
            Send your first request to <code className="rounded bg-white/10 px-1">GET /api/v1/ping</code>
            {" "}and it will appear here.
          </p>
        </div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <ul className="divide-y divide-white/5">
            {logs.map((log) => (
              <li key={log.id} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${methodColor(log.method)}`}
                    >
                      {log.method}
                    </span>
                    <code className="truncate text-xs font-mono text-white">{log.endpoint}</code>
                  </div>
                  <p className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-white/45">
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                    {log.duration_ms != null && <span>· {log.duration_ms}ms</span>}
                    {log.ip && (
                      <span className="flex items-center gap-0.5">
                        <Globe className="h-2.5 w-2.5" /> {log.ip}
                      </span>
                    )}
                    {log.key_prefix && <span>· key {log.key_prefix}…</span>}
                  </p>
                  {log.error && (
                    <p className="mt-1 flex items-start gap-1 text-[11px] text-red-300">
                      <AlertCircle className="h-3 w-3 shrink-0 translate-y-0.5" /> {log.error}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor(log.http_status)}`}
                >
                  {log.http_status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function methodColor(m: string): string {
  switch (m.toUpperCase()) {
    case "GET":
      return "bg-sky-500/15 text-sky-300";
    case "POST":
      return "bg-emerald-500/15 text-emerald-300";
    case "PUT":
    case "PATCH":
      return "bg-amber-500/15 text-amber-300";
    case "DELETE":
      return "bg-red-500/15 text-red-300";
    default:
      return "bg-white/10 text-white/65";
  }
}

function statusColor(s: number): string {
  if (s >= 200 && s < 300) return "bg-emerald-500/15 text-emerald-300";
  if (s >= 300 && s < 400) return "bg-sky-500/15 text-sky-300";
  if (s >= 400 && s < 500) return "bg-amber-500/15 text-amber-300";
  return "bg-red-500/15 text-red-300";
}

// ------------------------- Util -------------------------
function CopyButton({ value, solid = false }: { value: string; solid?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
        solid
          ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
          : "border border-white/15 text-white hover:bg-white/5"
      }`}
      aria-label="Copy"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
