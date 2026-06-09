import "server-only";

import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const ARKESEL_SEND_URL = "https://sms.arkesel.com/api/v2/sms/send";

export type SmsResult =
  | { ok: true; data: unknown }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped?: false; error: string };

export interface SmsLogContext {
  template?: string;
  triggeredBy?: string | null;
  context?: Record<string, unknown>;
}

/** Normalize to Arkesel format: 233XXXXXXXXX */
export function normalizeArkeselPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    digits = `233${digits.slice(1)}`;
  } else if (digits.length === 9) {
    digits = `233${digits}`;
  }
  if (!digits.startsWith("233") || digits.length !== 12) return null;
  return digits;
}

export function isArkeselConfigured() {
  return Boolean(process.env.ARKESEL_API_KEY && process.env.ARKESEL_SENDER_ID);
}

async function recordSmsLog(row: {
  template: string;
  recipient: string;
  message: string;
  status: "sent" | "failed" | "skipped";
  provider_response?: unknown;
  error?: string | null;
  triggered_by?: string | null;
  context?: Record<string, unknown> | null;
}) {
  if (!hasSupabaseConfig()) return;
  try {
    const service = createServiceClient();
    await service.from("sms_logs").insert({
      template: row.template,
      recipient: row.recipient,
      message: row.message,
      status: row.status,
      provider: "arkesel",
      provider_response: row.provider_response ?? null,
      error: row.error ?? null,
      triggered_by: row.triggered_by ?? null,
      context: row.context ?? null,
    });
  } catch (err) {
    console.error("[sms_logs] insert failed", err);
  }
}

export async function sendArkeselSms(
  recipients: string[],
  message: string,
  logCtx: SmsLogContext = {},
): Promise<SmsResult> {
  const apiKey = process.env.ARKESEL_API_KEY;
  const sender = process.env.ARKESEL_SENDER_ID;
  const template = logCtx.template ?? "manual";

  if (!apiKey || !sender) {
    console.warn("[arkesel] SMS skipped — set ARKESEL_API_KEY and ARKESEL_SENDER_ID");
    await Promise.all(
      recipients.map((r) =>
        recordSmsLog({
          template,
          recipient: r,
          message,
          status: "skipped",
          error: "ARKESEL credentials missing",
          triggered_by: logCtx.triggeredBy ?? null,
          context: logCtx.context ?? null,
        }),
      ),
    );
    return { ok: false, skipped: true, reason: "credentials_missing" };
  }

  const normalized = recipients
    .map((r) => ({ raw: r, normalized: normalizeArkeselPhone(r) }))
    .filter((x) => x.normalized != null) as { raw: string; normalized: string }[];

  if (normalized.length === 0) {
    console.warn("[arkesel] SMS skipped — no valid recipients");
    await Promise.all(
      recipients.map((r) =>
        recordSmsLog({
          template,
          recipient: r,
          message,
          status: "skipped",
          error: "invalid_phone",
          triggered_by: logCtx.triggeredBy ?? null,
          context: logCtx.context ?? null,
        }),
      ),
    );
    return { ok: false, skipped: true, reason: "invalid_recipients" };
  }

  const trimmed = message.slice(0, 160);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(ARKESEL_SEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender,
        message: trimmed,
        recipients: normalized.map((n) => n.normalized),
      }),
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => ({}))) as {
      status?: string;
      message?: string;
    };

    if (!res.ok) {
      const errorMsg = data.message ?? `HTTP ${res.status}`;
      console.error("[arkesel] send failed", res.status, data);
      await Promise.all(
        normalized.map((n) =>
          recordSmsLog({
            template,
            recipient: n.normalized,
            message: trimmed,
            status: "failed",
            provider_response: data,
            error: errorMsg,
            triggered_by: logCtx.triggeredBy ?? null,
            context: logCtx.context ?? null,
          }),
        ),
      );
      return { ok: false, error: errorMsg };
    }

    await Promise.all(
      normalized.map((n) =>
        recordSmsLog({
          template,
          recipient: n.normalized,
          message: trimmed,
          status: "sent",
          provider_response: data,
          triggered_by: logCtx.triggeredBy ?? null,
          context: logCtx.context ?? null,
        }),
      ),
    );

    return { ok: true, data };
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Arkesel request timed out"
        : err instanceof Error
          ? err.message
          : String(err);
    console.error("[arkesel] network error", err);
    await Promise.all(
      normalized.map((n) =>
        recordSmsLog({
          template,
          recipient: n.normalized,
          message: trimmed,
          status: "failed",
          error: message,
          triggered_by: logCtx.triggeredBy ?? null,
          context: logCtx.context ?? null,
        }),
      ),
    );
    return { ok: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}
