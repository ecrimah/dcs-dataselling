import "server-only";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

export interface SmsLogRow {
  id: string;
  template: string;
  recipient: string;
  message: string;
  status: "sent" | "failed" | "skipped";
  provider: string;
  error: string | null;
  context: Record<string, unknown> | null;
  triggeredByEmail: string | null;
  createdAt: string;
}

export interface SmsLogSummary {
  total: number;
  sentLast24h: number;
  failedLast24h: number;
  skippedLast24h: number;
  byTemplate: { template: string; sent: number; failed: number }[];
}

interface RawRow {
  id: string;
  template: string;
  recipient: string;
  message: string;
  status: "sent" | "failed" | "skipped";
  provider: string;
  error: string | null;
  context: Record<string, unknown> | null;
  created_at: string;
  triggered_by: string | null;
  profiles?: { email: string } | { email: string }[] | null;
}

export async function fetchSmsLogs(limit = 100): Promise<SmsLogRow[]> {
  if (!hasSupabaseConfig()) return [];
  const service = createServiceClient();
  const { data, error } = await service
    .from("sms_logs")
    .select(
      "id, template, recipient, message, status, provider, error, context, created_at, triggered_by, profiles:triggered_by ( email )",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("[fetchSmsLogs]", error);
    return [];
  }

  return (data as RawRow[]).map((row) => {
    const trig = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      template: row.template,
      recipient: row.recipient,
      message: row.message,
      status: row.status,
      provider: row.provider,
      error: row.error,
      context: row.context,
      triggeredByEmail: trig?.email ?? null,
      createdAt: row.created_at,
    };
  });
}

export async function fetchSmsLogSummary(): Promise<SmsLogSummary> {
  const empty: SmsLogSummary = {
    total: 0,
    sentLast24h: 0,
    failedLast24h: 0,
    skippedLast24h: 0,
    byTemplate: [],
  };
  if (!hasSupabaseConfig()) return empty;
  const service = createServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: total }, recentRes] = await Promise.all([
    service.from("sms_logs").select("*", { count: "exact", head: true }),
    service
      .from("sms_logs")
      .select("template, status")
      .gte("created_at", since),
  ]);

  const rows = (recentRes.data ?? []) as { template: string; status: string }[];
  const byTemplateMap = new Map<string, { sent: number; failed: number }>();
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const r of rows) {
    if (r.status === "sent") sent++;
    else if (r.status === "failed") failed++;
    else if (r.status === "skipped") skipped++;
    const cur = byTemplateMap.get(r.template) ?? { sent: 0, failed: 0 };
    if (r.status === "sent") cur.sent++;
    if (r.status === "failed") cur.failed++;
    byTemplateMap.set(r.template, cur);
  }

  return {
    total: total ?? 0,
    sentLast24h: sent,
    failedLast24h: failed,
    skippedLast24h: skipped,
    byTemplate: Array.from(byTemplateMap.entries())
      .map(([template, c]) => ({ template, ...c }))
      .sort((a, b) => b.sent + b.failed - (a.sent + a.failed)),
  };
}
