import "server-only";

const ARKESEL_SEND_URL = "https://sms.arkesel.com/api/v2/sms/send";

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

export async function sendArkeselSms(recipients: string[], message: string) {
  const apiKey = process.env.ARKESEL_API_KEY;
  const sender = process.env.ARKESEL_SENDER_ID;

  if (!apiKey || !sender) {
    console.warn("[arkesel] SMS skipped — set ARKESEL_API_KEY and ARKESEL_SENDER_ID");
    return { ok: false as const, skipped: true };
  }

  const normalized = recipients
    .map(normalizeArkeselPhone)
    .filter((n): n is string => n != null);

  if (normalized.length === 0) {
    console.warn("[arkesel] SMS skipped — no valid recipients");
    return { ok: false as const, skipped: true };
  }

  const res = await fetch(ARKESEL_SEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender,
      message: message.slice(0, 160),
      recipients: normalized,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { status?: string; message?: string };

  if (!res.ok) {
    console.error("[arkesel] send failed", res.status, data);
    return { ok: false as const, error: data.message ?? "SMS send failed" };
  }

  return { ok: true as const, data };
}
