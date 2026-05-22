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
  Sparkles,
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
import { cn } from "@/lib/utils";

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
  const summary = initialSummary;
  const [webhook, setWebhook] = useState(initialWebhook);
  const [deliveries, setDeliveries] = useState(initialDeliveries);

  const activeKey = keys.find((k) => k.active && !k.revoked_at);

  return (
    <div>
      {/* Hero band — navy with subtle radials, just like the storefront */}
      <section className="page-hero page-hero-ribbon">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="brand-strip">
                <Code2 className="h-3.5 w-3.5" />
                Developer API
              </span>
              <h1 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-[28px]">
                Sell data <span className="text-amber-300">programmatically</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-[15px]">
                Issue API keys to bots, downstream resellers, or staff and let them
                place orders against{" "}
                <span className="font-semibold text-white">{vendorName}</span>{" "}
                automatically. Orders debit your wallet and route to the same suppliers
                that power your dashboard.
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold whitespace-nowrap",
                activeKey
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                  : "border-amber-400/40 bg-amber-500/15 text-amber-200",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  activeKey ? "bg-emerald-300" : "bg-amber-300",
                )}
              />
              {activeKey ? "API Live" : "No active key"}
            </span>
          </div>
        </div>
      </section>

      {/* Stat strip that overlaps the hero (storefront pattern) */}
      <div className="mx-auto -mt-6 max-w-7xl px-4 sm:-mt-8 sm:px-6 lg:px-8">
        <div className="stat-strip grid grid-cols-2 sm:grid-cols-4">
          <HeroStat label="Calls 24h" value={summary.total_24h.toLocaleString()} />
          <HeroStat
            label="Errors 24h"
            value={summary.errors_24h.toLocaleString()}
            tone={summary.errors_24h > 0 ? "rose" : "emerald"}
          />
          <HeroStat label="Calls 7d" value={summary.total_7d.toLocaleString()} />
          <HeroStat
            label="Avg latency"
            value={summary.avg_duration_ms != null ? `${summary.avg_duration_ms}ms` : "—"}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Tabs */}
      <div className="tab-rail">
        <TabButton id="overview" current={tab} onClick={setTab} icon={<Activity className="h-3.5 w-3.5" />}>
          Overview
        </TabButton>
        <TabButton id="keys" current={tab} onClick={setTab} icon={<Key className="h-3.5 w-3.5" />}>
          API Keys
          <CountBadge value={keys.filter((k) => k.active && !k.revoked_at).length} />
        </TabButton>
        <TabButton id="webhook" current={tab} onClick={setTab} icon={<Webhook className="h-3.5 w-3.5" />}>
          Webhooks
          {webhook.url && <span className="ml-1 dot dot-emerald" />}
        </TabButton>
        <TabButton id="docs" current={tab} onClick={setTab} icon={<Book className="h-3.5 w-3.5" />}>
          Docs
        </TabButton>
        <TabButton id="logs" current={tab} onClick={setTab} icon={<Activity className="h-3.5 w-3.5" />}>
          Logs
        </TabButton>
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
      {tab === "keys" && <KeysPanel keys={keys} setKeys={setKeys} />}
      {tab === "webhook" && (
        <WebhookPanel
          webhook={webhook}
          setWebhook={setWebhook}
          deliveries={deliveries}
          setDeliveries={setDeliveries}
        />
      )}
      {tab === "docs" && <DocsBrowser apiBase={apiBase} />}
      {tab === "logs" && <LogsPanel logs={logs} setLogs={setLogs} />}
      </div>
    </div>
  );
}

// =================================================================
// Pieces
// =================================================================

function HeroStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "emerald" | "rose" | "gold";
}) {
  const accent =
    tone === "emerald"
      ? "is-emerald"
      : tone === "rose"
        ? "is-rose"
        : tone === "gold"
          ? "is-gold"
          : "";
  return (
    <div className="stat-cell">
      <p className="stat-label">{label}</p>
      <p className={cn("stat-value", accent)}>{value}</p>
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
      className={cn("tab-rail-btn", active && "tab-rail-btn-active")}
    >
      {icon}
      {children}
    </button>
  );
}

function CountBadge({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold">
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
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <ChecklistCard
          icon={<Key className="h-4 w-4" />}
          title="API Keys"
          done={Boolean(activeKey)}
          status={activeKey ? "1+ active key" : "No active keys yet"}
          actionLabel={activeKey ? "Manage" : "Create your first key"}
          onAction={onGoToKeys}
        />
        <ChecklistCard
          icon={<Webhook className="h-4 w-4" />}
          title="Webhook"
          done={Boolean(webhook.url)}
          status={webhook.url ? "Configured & signed" : "Optional — get real-time updates"}
          actionLabel={webhook.url ? "Manage" : "Set up"}
          onAction={onGoToWebhook}
        />
      </div>

      <div className="panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow-section flex-1">Base URL</p>
          <CopyButton value={`${apiBase}/api/v1`} />
        </div>
        <div className="code-vault flex items-center gap-2 px-4 py-3">
          <span className="dot dot-emerald" />
          <code className="font-mono text-sm">{apiBase}/api/v1</code>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-white/55">
          <Shield className="h-3.5 w-3.5 text-gold" />
          Every request must include{" "}
          <code className="code-inline">Authorization: Bearer dcs_…</code>
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="panel p-4 text-center">
          <p className="eyebrow-section justify-center">Calls (7d)</p>
          <p className="metric metric-md mt-3">{summary.total_7d.toLocaleString()}</p>
        </div>
        <div className="panel p-4 text-center">
          <p className="eyebrow-section justify-center">Error rate</p>
          <p
            className={cn(
              "metric metric-md mt-3",
              summary.errors_7d === 0 ? "text-emerald-300" : "text-amber-300",
            )}
          >
            {errorRate}%
          </p>
        </div>
        <div className="panel p-4 text-center">
          <p className="eyebrow-section justify-center">Top endpoint</p>
          <p
            className="mt-3 truncate font-mono text-sm font-bold text-white"
            title={summary.top_endpoint ?? "—"}
          >
            {summary.top_endpoint ?? "—"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onGoToDocs}
        className="panel-gold flex w-full items-center justify-between p-4 text-left transition hover:brightness-110"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15">
            <Book className="h-5 w-5 text-gold" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Read the docs →</p>
            <p className="mt-0.5 text-xs text-white/60">
              Endpoints, code samples (curl/JS/Python), error codes, webhook signing.
            </p>
          </div>
        </div>
        <Sparkles className="h-4 w-4 text-gold" />
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
    <div className={cn("flex flex-col gap-2 p-4", done ? "panel-emerald" : "panel")}>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            done ? "feature-icon-emerald" : "feature-icon-slate",
          )}
        >
          {done ? <CheckCircle2 className="h-4 w-4" /> : icon}
        </div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {done && <span className="ml-auto chip chip-emerald">Ready</span>}
      </div>
      <p className="text-xs text-muted">{status}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-1 self-start text-xs font-bold text-amber-700 hover:underline"
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
      <div className="panel p-5">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-bold text-white">Generate a new key</h3>
        </div>
        <p className="text-xs text-white/55">
          Each key is shown <strong>once</strong>. Store it in a secret manager.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Name (e.g. 'Telegram bot')"
            className="input-dark w-full"
          />
          <input
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            maxLength={3}
            placeholder="Expires in (days, optional)"
            className="input-dark w-full"
          />
        </div>
        <button type="button" onClick={createKey} disabled={loading} className="btn btn-gold mt-4">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Generate key
        </button>

        {newKey && (
          <div className="panel-emerald mt-4 p-4">
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
            <div className="code-vault mt-2 flex items-center gap-2 px-3 py-2">
              <code className="flex-1 break-all text-xs">{newKey.key}</code>
              <CopyButton value={newKey.key} solid />
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 px-1">
          <p className="eyebrow-section">Your keys ({keys.length})</p>
        </div>
        {keys.length === 0 ? (
          <div className="panel p-8 text-center">
            <Key className="mx-auto h-8 w-8 text-white/25" />
            <p className="mt-2 text-sm text-white/55">No API keys yet.</p>
          </div>
        ) : (
          <ul className="panel divide-vault overflow-hidden">
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
    <li className="row-hover flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{k.name}</p>
          <span className={cn("chip", isActive && !isExpired ? "chip-emerald" : "chip-muted")}>
            {!isActive ? "Revoked" : isExpired ? "Expired" : "Active"}
          </span>
        </div>
        <p className="mt-0.5 font-mono text-xs text-white/40">{k.key_prefix}…</p>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-white/40">
          <span>{k.total_requests.toLocaleString()} requests</span>
          <span>
            {k.last_used_at
              ? `Last used ${new Date(k.last_used_at).toLocaleString()}`
              : "Never used"}
          </span>
          {k.expires_at && <span>Expires {new Date(k.expires_at).toLocaleDateString()}</span>}
          <span>Created {new Date(k.created_at).toLocaleDateString()}</span>
        </p>
      </div>
      {isActive && (
        <button type="button" onClick={onRevoke} className="btn btn-danger px-3 py-1.5 text-xs">
          <Trash2 className="h-3.5 w-3.5" /> Revoke
        </button>
      )}
    </li>
  );
}

// ------------------------- Webhook -------------------------
function WebhookPanel({
  webhook,
  setWebhook,
  deliveries,
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

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="flex items-center gap-2">
          <Webhook className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-bold text-white">Outbound webhook</h3>
        </div>
        <p className="mt-1 text-xs text-white/55">
          We POST a signed JSON payload to your URL when an order&apos;s status changes.
          Events: <code className="code-inline">order.fulfilled</code>,{" "}
          <code className="code-inline">order.failed</code>.
        </p>

        <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
          URL (HTTPS only)
        </label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-bot.example.com/webhooks/dcs"
          className="input-dark mt-1.5 w-full"
        />

        <label className="mt-3 inline-flex items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-gold"
          />
          Deliveries enabled
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => save(false)} disabled={saving} className="btn btn-gold">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save
          </button>
          {webhook.has_secret && (
            <button
              type="button"
              onClick={() => save(true)}
              disabled={saving}
              className="btn btn-ghost"
            >
              <RefreshCw className="h-4 w-4" /> Rotate secret
            </button>
          )}
          {webhook.url && (
            <button type="button" onClick={remove} className="btn btn-danger">
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          )}
        </div>

        {newSecret && (
          <div className="panel-emerald mt-4 p-4">
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
            <div className="code-vault mt-2 flex items-center gap-2 px-3 py-2">
              <code className="flex-1 break-all text-xs">{newSecret}</code>
              <CopyButton value={newSecret} solid />
            </div>
            <p className="mt-2 text-[10px] text-white/50">
              Used to verify the <code className="code-inline">X-DCS-Signature</code> HMAC-SHA256
              header on incoming webhooks.
            </p>
          </div>
        )}
      </div>

      <div>
        <p className="eyebrow-section mb-2 px-1">Recent deliveries</p>
        {deliveries.length === 0 ? (
          <div className="panel p-8 text-center text-xs text-white/55">
            No deliveries yet — they appear when orders fulfil.
          </div>
        ) : (
          <ul className="panel divide-vault overflow-hidden">
            {deliveries.map((d) => (
              <li key={d.id} className="row-hover flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-white">{d.event}</code>
                    <span className="text-[10px] text-white/40">{d.reference ?? "—"}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-white/40">
                    {new Date(d.created_at).toLocaleString()} · {d.attempts}{" "}
                    {d.attempts === 1 ? "attempt" : "attempts"}
                  </p>
                  {d.error && <p className="mt-1 text-[11px] text-rose-300">{d.error}</p>}
                </div>
                <span className={cn("chip", d.ok ? "chip-emerald" : "chip-rose")}>
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
        <p className="eyebrow-section flex-1">Recent API calls</p>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="btn btn-ghost px-3 py-1.5 text-xs"
        >
          {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Refresh
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="panel p-10 text-center">
          <Send className="mx-auto h-8 w-8 text-white/25" />
          <p className="mt-2 text-sm font-semibold text-white">No traffic yet</p>
          <p className="mt-1 text-xs text-white/55">
            Send your first request to <code className="code-inline">GET /api/v1/ping</code> and it
            will appear here.
          </p>
        </div>
      ) : (
        <ul className="panel divide-vault overflow-hidden">
          {logs.map((log) => (
            <li key={log.id} className="row-hover flex items-start justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("chip", methodChip(log.method))}>{log.method}</span>
                  <code className="truncate text-xs font-mono text-white">{log.endpoint}</code>
                </div>
                <p className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-white/40">
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
                  <p className="mt-1 flex items-start gap-1 text-[11px] text-rose-300">
                    <AlertCircle className="h-3 w-3 shrink-0 translate-y-0.5" /> {log.error}
                  </p>
                )}
              </div>
              <span className={cn("chip", statusChip(log.http_status))}>
                {log.http_status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function methodChip(m: string): string {
  switch (m.toUpperCase()) {
    case "GET":
      return "chip-sky";
    case "POST":
      return "chip-emerald";
    case "PUT":
    case "PATCH":
      return "chip-amber";
    case "DELETE":
      return "chip-rose";
    default:
      return "chip-muted";
  }
}

function statusChip(s: number): string {
  if (s >= 200 && s < 300) return "chip-emerald";
  if (s >= 300 && s < 400) return "chip-sky";
  if (s >= 400 && s < 500) return "chip-amber";
  return "chip-rose";
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
      className={cn("btn px-2.5 py-1.5 text-xs", solid ? "btn-emerald" : "btn-ghost")}
      aria-label="Copy"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
