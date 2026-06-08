import { timingSafeEqual } from "crypto";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/** Extract a shared secret from common SMS-forwarder auth patterns. */
export function extractSmsForwarderSecret(request: Request): string | null {
  const url = new URL(request.url);
  for (const key of ["secret", "api_key", "apikey", "token"]) {
    const value = url.searchParams.get(key)?.trim();
    if (value) return value;
  }

  const headerSecret = request.headers.get("x-sms-forwarder-secret")?.trim();
  if (headerSecret) return headerSecret;

  const apiKey = request.headers.get("x-api-key")?.trim();
  if (apiKey) return apiKey;

  const auth = request.headers.get("authorization")?.trim() ?? "";
  if (!auth) return null;

  const bearerMatch = /^bearer\s+(.+)$/i.exec(auth);
  if (bearerMatch) return bearerMatch[1].trim();

  // Some forwarder apps put only the raw secret in Authorization (no "Bearer " prefix).
  return auth;
}

export function isSmsForwarderAuthorized(request: Request, expectedSecret: string): boolean {
  const expected = expectedSecret.trim();
  if (!expected) return false;

  const provided = extractSmsForwarderSecret(request);
  if (!provided) return false;

  return safeEqual(provided, expected);
}
