import "server-only";

import { NextResponse } from "next/server";
import {
  authenticateApiKey,
  getClientIp,
  logApiCall,
  type ApiKeyContext,
} from "@/lib/auth/api-key";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

export interface ApiHandlerContext {
  ctx: ApiKeyContext;
  body: unknown;
  ip: string | null;
  userAgent: string | null;
  url: URL;
  params: Record<string, string>;
  durationMs: () => number;
}

export interface ApiHandlerResult {
  status?: number;
  json: unknown;
  /** Short summary stored in the audit log (no PII beyond what came in) */
  responseSummary?: unknown;
}

/**
 * Wraps a /api/v1/* handler so it gets:
 *  - Bearer-key authentication (responds 401 if missing/invalid)
 *  - Request body parsing (JSON)
 *  - Uniform CORS headers
 *  - Automatic audit logging via vendor_api_logs
 *
 * Usage:
 *   export const POST = handleApi(async ({ ctx, body }) => ({ json: { ... } }));
 */
export function handleApi(
  fn: (handler: ApiHandlerContext) => Promise<ApiHandlerResult>,
  options: { method?: string; endpoint?: string } = {},
) {
  return async function handler(
    request: Request,
    routeContext?: { params: Promise<Record<string, string>> },
  ): Promise<Response> {
    const startedAt = performance.now();
    const method = options.method ?? request.method;
    const endpoint =
      options.endpoint ??
      (() => {
        try {
          return new URL(request.url).pathname;
        } catch {
          return request.url;
        }
      })();

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent");

    const auth = await authenticateApiKey(request);
    if (!auth.ok) {
      await logApiCall({
        vendorId: undefined,
        keyId: null,
        keyPrefix: null,
        endpoint: `${method} ${endpoint}`,
        method,
        httpStatus: auth.status,
        durationMs: Math.round(performance.now() - startedAt),
        ip,
        userAgent,
        error: auth.error,
      });
      return jsonResponse({ error: auth.error, code: auth.code }, auth.status);
    }

    let body: unknown = null;
    if (method === "POST" || method === "PUT" || method === "PATCH") {
      try {
        const text = await request.text();
        body = text ? JSON.parse(text) : null;
      } catch {
        await logApiCall({
          ctx: auth.ctx,
          endpoint: `${method} ${endpoint}`,
          method,
          httpStatus: 400,
          durationMs: Math.round(performance.now() - startedAt),
          ip,
          userAgent,
          error: "Invalid JSON body",
        });
        return jsonResponse({ error: "Invalid JSON body", code: "invalid_json" }, 400);
      }
    }

    let params: Record<string, string> = {};
    if (routeContext?.params) {
      try {
        params = await routeContext.params;
      } catch {
        // ignore
      }
    }

    let url: URL;
    try {
      url = new URL(request.url);
    } catch {
      url = new URL("http://localhost" + endpoint);
    }

    try {
      const result = await fn({
        ctx: auth.ctx,
        body,
        ip,
        userAgent,
        url,
        params,
        durationMs: () => Math.round(performance.now() - startedAt),
      });
      const status = result.status ?? 200;
      await logApiCall({
        ctx: auth.ctx,
        endpoint: `${method} ${endpoint}`,
        method,
        httpStatus: status,
        durationMs: Math.round(performance.now() - startedAt),
        ip,
        userAgent,
        requestBody: body,
        responseSummary: result.responseSummary,
      });
      return jsonResponse(result.json, status);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Internal error";
      console.error(`[api/v1] ${method} ${endpoint}`, err);
      await logApiCall({
        ctx: auth.ctx,
        endpoint: `${method} ${endpoint}`,
        method,
        httpStatus: 500,
        durationMs: Math.round(performance.now() - startedAt),
        ip,
        userAgent,
        requestBody: body,
        error: msg,
      });
      return jsonResponse({ error: "Internal error", code: "internal_error" }, 500);
    }
  };
}

export function jsonResponse(payload: unknown, status: number): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: CORS_HEADERS,
  });
}

export function corsPreflightResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function normalizeGhanaPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return digits;
  if (digits.length === 12 && digits.startsWith("233")) return `0${digits.slice(3)}`;
  if (digits.length === 9) return `0${digits}`;
  return null;
}
