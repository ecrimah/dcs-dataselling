import "server-only";

import crypto from "crypto";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

/** Shape returned from `fetchVendorApiKeysFull`. */
export interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  active: boolean;
  revoked_at: string | null;
  last_used_at: string | null;
  last_used_ip: string | null;
  total_requests: number;
  expires_at: string | null;
  created_at: string;
}

/** Detailed list for the developer dashboard (includes ops metadata). */
export async function fetchVendorApiKeysFull(vendorId: string): Promise<ApiKeyRow[]> {
  if (!hasSupabaseConfig()) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("vendor_api_keys")
    .select(
      "id, name, key_prefix, active, revoked_at, last_used_at, last_used_ip, total_requests, expires_at, created_at",
    )
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ApiKeyRow[];
}

export interface ApiLogRow {
  id: string;
  endpoint: string;
  method: string;
  http_status: number;
  duration_ms: number | null;
  ip: string | null;
  user_agent: string | null;
  key_prefix: string | null;
  error: string | null;
  created_at: string;
}

export async function fetchVendorApiLogs(vendorId: string, limit = 50): Promise<ApiLogRow[]> {
  if (!hasSupabaseConfig()) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("vendor_api_logs")
    .select(
      "id, endpoint, method, http_status, duration_ms, ip, user_agent, key_prefix, error, created_at",
    )
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(200, limit)));
  return (data ?? []) as ApiLogRow[];
}

export interface ApiUsageSummary {
  total_24h: number;
  errors_24h: number;
  total_7d: number;
  errors_7d: number;
  avg_duration_ms: number | null;
  top_endpoint: string | null;
}

export async function fetchVendorApiSummary(vendorId: string): Promise<ApiUsageSummary> {
  const empty: ApiUsageSummary = {
    total_24h: 0,
    errors_24h: 0,
    total_7d: 0,
    errors_7d: 0,
    avg_duration_ms: null,
    top_endpoint: null,
  };
  if (!hasSupabaseConfig()) return empty;

  const service = createServiceClient();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await service
    .from("vendor_api_logs")
    .select("endpoint, http_status, duration_ms, created_at")
    .eq("vendor_id", vendorId)
    .gte("created_at", since7d)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (!data) return empty;

  type Row = { endpoint: string; http_status: number; duration_ms: number | null; created_at: string };
  const rows = data as Row[];

  const since24h = Date.now() - 24 * 60 * 60 * 1000;
  let total24 = 0;
  let err24 = 0;
  let totalDur = 0;
  let durCount = 0;
  const endpointCount = new Map<string, number>();

  for (const r of rows) {
    if (r.duration_ms != null) {
      totalDur += r.duration_ms;
      durCount += 1;
    }
    endpointCount.set(r.endpoint, (endpointCount.get(r.endpoint) ?? 0) + 1);
    if (new Date(r.created_at).getTime() >= since24h) {
      total24 += 1;
      if (r.http_status >= 400) err24 += 1;
    }
  }

  const err7 = rows.filter((r) => r.http_status >= 400).length;
  const top = [...endpointCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    total_24h: total24,
    errors_24h: err24,
    total_7d: rows.length,
    errors_7d: err7,
    avg_duration_ms: durCount > 0 ? Math.round(totalDur / durCount) : null,
    top_endpoint: top,
  };
}

export interface WebhookConfig {
  url: string | null;
  enabled: boolean;
  has_secret: boolean;
}

export async function fetchVendorWebhook(vendorId: string): Promise<WebhookConfig> {
  if (!hasSupabaseConfig()) return { url: null, enabled: false, has_secret: false };
  const service = createServiceClient();
  const { data } = await service
    .from("vendors")
    .select("api_webhook_url, api_webhook_secret, api_webhook_enabled")
    .eq("id", vendorId)
    .maybeSingle();
  const v = data as {
    api_webhook_url: string | null;
    api_webhook_secret: string | null;
    api_webhook_enabled: boolean | null;
  } | null;
  return {
    url: v?.api_webhook_url ?? null,
    enabled: v?.api_webhook_enabled ?? true,
    has_secret: Boolean(v?.api_webhook_secret),
  };
}

export async function saveVendorWebhook(
  vendorId: string,
  args: { url: string | null; rotateSecret?: boolean; enabled?: boolean },
): Promise<{ url: string | null; enabled: boolean; secret?: string }> {
  if (!hasSupabaseConfig()) throw new Error("Database not configured");

  const service = createServiceClient();
  const trimmedUrl = args.url?.trim() || null;

  if (trimmedUrl) {
    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
        throw new Error("Webhook URL must use HTTPS");
      }
    } catch {
      throw new Error("Invalid webhook URL");
    }
  }

  const update: Record<string, unknown> = {
    api_webhook_url: trimmedUrl,
    api_webhook_enabled: args.enabled ?? true,
  };

  let newSecret: string | undefined;
  if (args.rotateSecret || trimmedUrl) {
    // Re-use existing secret if there is one and rotateSecret isn't set;
    // otherwise mint a fresh one.
    if (args.rotateSecret) {
      newSecret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
      update.api_webhook_secret = newSecret;
    } else {
      const { data: existing } = await service
        .from("vendors")
        .select("api_webhook_secret")
        .eq("id", vendorId)
        .maybeSingle();
      const hasSecret = Boolean((existing as { api_webhook_secret: string | null } | null)?.api_webhook_secret);
      if (!hasSecret) {
        newSecret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
        update.api_webhook_secret = newSecret;
      }
    }
  } else if (trimmedUrl === null) {
    // Clearing the URL — also clear the secret so a fresh one is minted next time.
    update.api_webhook_secret = null;
  }

  const { error } = await service.from("vendors").update(update).eq("id", vendorId);
  if (error) throw new Error("Could not save webhook");

  return {
    url: trimmedUrl,
    enabled: args.enabled ?? true,
    secret: newSecret,
  };
}

export interface WebhookDeliveryRow {
  id: string;
  event: string;
  reference: string | null;
  target_url: string;
  http_status: number | null;
  ok: boolean | null;
  attempts: number;
  error: string | null;
  created_at: string;
}

export async function fetchVendorWebhookDeliveries(
  vendorId: string,
  limit = 20,
): Promise<WebhookDeliveryRow[]> {
  if (!hasSupabaseConfig()) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("vendor_webhook_deliveries")
    .select("id, event, reference, target_url, http_status, ok, attempts, error, created_at")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(100, limit)));
  return (data ?? []) as WebhookDeliveryRow[];
}
